import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { buildConsecutiveRunDistribution } from '@/app/analysis/combination/logic/buildConsecutiveRunDistribution'
import { buildOddEvenDistribution } from '@/app/analysis/combination/logic/buildOddEvenDistribution'
import {
  BAND_COUNT,
  BAND_WIDTH,
  NUMBER_BAND_LABELS,
} from '@/app/analysis/combination/constants/bandLabels'
import { buildPositionBandDistribution } from '@/app/analysis/combination/logic/buildPositionBandDistribution'
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand'
import { buildSumExtremeStats } from '@/app/analysis/combination/logic/buildSumExtremeStats'
import type { PositionBandDistributionRow } from '@/app/analysis/combination/types'
import type { GeneratedSet } from '@/app/recommend/logic/types'
import {
  buildMetricsOnlyFromPool,
  buildOneSetWithFallback,
  buildPoolByBand,
  diagnoseProfileBuild,
  PROFILE_BUILD_ATTEMPTS,
  randomPerPositionPick,
  sortPickedAsc,
  type ProfileConstraints,
  type ProfileFailureReason,
  type RepairPickCtx,
} from '@/app/recommend/logic/combinationBandRepair'

const METHOD_JL = 'JL Wheel Method'

/** 추천 페이지에서 생성·저장할 목표 세트 수 */
export const TARGET_SET_COUNT = 20

/**
 * 고정 20슬롯 (oe, run, band). band1~3·15패턴 + 앞 5슬롯 1회 더(20세트).
 */
const MAX_PRIORITY_ROUNDS = 24

/** 15슬롯 1회분(oe1~2×run1~2·oe3×run1, 각 band1~3) */
export const COMBO_PROFILE_SLOT_CYCLE: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 1],
  [1, 1, 2],
  [1, 1, 3],
  [1, 2, 1],
  [1, 2, 2],
  [1, 2, 3],
  [2, 1, 1],
  [2, 1, 2],
  [2, 1, 3],
  [2, 2, 1],
  [2, 2, 2],
  [2, 2, 3],
  [3, 1, 1],
  [3, 1, 2],
  [3, 1, 3],
] as const

/** 생성·표시 순서 — 15패턴 + oe1 run1~2 band1~2 재시도 5슬롯 */
export const COMBO_PROFILE_SLOT_ORDER: ReadonlyArray<readonly [number, number, number]> = [
  ...COMBO_PROFILE_SLOT_CYCLE,
  ...COMBO_PROFILE_SLOT_CYCLE.slice(0, 5),
]

/** @deprecated COMBO_PROFILE_SLOT_ORDER 사용 */
export const COMBO_RANK_TRIPLE_PRIORITY_ORDER: [number, number, number][] = [
  ...COMBO_PROFILE_SLOT_ORDER,
]

if (COMBO_PROFILE_SLOT_ORDER.length !== TARGET_SET_COUNT) {
  throw new Error('COMBO_PROFILE_SLOT_ORDER must match TARGET_SET_COUNT')
}

const MIN_RANKABLE_PERCENT = 10

/** 자리별 N등 비율이 이 값 미만이면 해당 자리는 1등(band1) 구간 목표를 쓴다 */
export const MIN_BAND_TIER_PERCENT = 20

const DEFAULT_REPAIR_YIELD_EVERY = 64

async function yieldToMain(): Promise<void> {
  const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  if (sched?.yield) {
    await sched.yield()
    return
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

function withSortedMains(row: WinningNumberRow): WinningNumberRow {
  const m = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6].sort((a, b) => a - b)
  return {
    ...row,
    num1: m[0],
    num2: m[1],
    num3: m[2],
    num4: m[3],
    num5: m[4],
    num6: m[5],
  }
}

function bandIndexFromRow(row: PositionBandDistributionRow): number {
  const idx = NUMBER_BAND_LABELS.indexOf(row.bandLabel as (typeof NUMBER_BAND_LABELS)[number])
  return idx >= 0 ? idx : 0
}

/** 5단위 번호구간의 시작 번호(1, 6, 11, …) */
export function bandStartForIndex(bandIndex: number): number {
  return bandIndex * BAND_WIDTH + 1
}

/** 5단위 구간 내 칸(0~4). 0=하·4=상에 대응 */
export function bandInnerSlot(n: number): number {
  return n - bandStartForIndex(numberToBandIndex(n))
}

/** 구간×칸 사용 빈도 Map 키 */
export function innerSlotKey(n: number): string {
  const b = numberToBandIndex(n)
  return `${b}:${n - bandStartForIndex(b)}`
}

function evenCountAtRank(
  rows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  rank1: number,
): number | null {
  const eligible = rows.filter((r) => r.percentage > MIN_RANKABLE_PERCENT)
  const sorted = [...eligible].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.evenCount - b.evenCount
  })
  if (sorted.length < rank1) return null
  return sorted[rank1 - 1]?.evenCount ?? null
}

function maxRunAtRank(
  rows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  rank1: number,
): number | null {
  const eligible = rows.filter((r) => r.percentage > MIN_RANKABLE_PERCENT)
  const sorted = [...eligible].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.maxRunLength - b.maxRunLength
  })
  if (sorted.length < rank1) return null
  const v = sorted[rank1 - 1]?.maxRunLength
  return v !== undefined ? v : null
}

/** 자리별 비율 순에서 bandIndex가 겹치지 않게 1~4등 구간 인덱스 목록 */
function distinctBandRanksForPosition(
  sorted: readonly PositionBandDistributionRow[],
): number[] {
  const ranks: number[] = []
  const seen = new Set<number>()
  for (const row of sorted) {
    const b = bandIndexFromRow(row)
    if (seen.has(b)) continue
    seen.add(b)
    ranks.push(b)
  }
  return ranks
}

/** 오름차순 6개를 만들 수 있도록 bandIndex가 비내림인지 */
export function areBandTargetsMonotonic(bandTargets: readonly number[]): boolean {
  for (let i = 1; i < bandTargets.length; i++) {
    if (bandTargets[i]! < bandTargets[i - 1]!) return false
  }
  return true
}

const MAX_BAND_INDEX = BAND_COUNT - 1

/** 자리별 비율 순에서 bandTier(1~4)에 해당하는 bandIndex(누적 minBand 없음) */
function pickBandIndexForPosition(
  sorted: readonly PositionBandDistributionRow[],
  rankIdx: number,
): number | null {
  const distinctRanks = distinctBandRanksForPosition(sorted)
  if (distinctRanks.length > rankIdx) return distinctRanks[rankIdx]!
  if (sorted.length > rankIdx) return bandIndexFromRow(sorted[rankIdx]!)
  if (sorted.length > 0) return bandIndexFromRow(sorted[sorted.length - 1]!)
  return null
}

/** N등 비율이 MIN_BAND_TIER_PERCENT 미만이면 1등(0) 순위로 대체 */
export function effectiveBandRankIdx(
  sorted: readonly PositionBandDistributionRow[],
  rankIdx: number,
): number {
  if (sorted.length === 0) return 0
  const tierPct =
    sorted.length > rankIdx
      ? sorted[rankIdx]!.percentage
      : sorted[sorted.length - 1]!.percentage
  return tierPct < MIN_BAND_TIER_PERCENT ? 0 : rankIdx
}

/** 정렬 주6(작→큰)에 맞게 슬롯별 bandIndex를 비내림으로 보정 */
export function makeMonotonicBandTargets(raw: readonly number[]): number[] {
  const out = [...raw]
  for (let i = 1; i < out.length; i++) {
    if (out[i]! < out[i - 1]!) out[i] = out[i - 1]!
  }
  return out
}

/** 이전 tier와 목표 배열이 같을 때만 끝 슬롯을 한 칸 올려 tier 구분 */
function differentiateBandTargetsFromPrev(
  targets: readonly number[],
  prev: readonly number[],
): number[] {
  const out = [...targets]
  const same = out.length === prev.length && out.every((v, i) => v === prev[i])
  if (!same) return out
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i]! < MAX_BAND_INDEX) {
      out[i] = out[i]! + 1
      return out
    }
  }
  return out
}

/**
 * 자리(1~6)마다 bandTier(1~4)에 해당하는 번호대 bandIndex 목표.
 * 조합 분석 표와 동일하게 자리별 비율 1~4등만 쓴다(슬롯 간 band 비내림 보정 없음).
 * 1~6번 구간은 각각 독립 추출 후, 합·홀짝·연속만 정렬된 6개로 검사한다.
 */
export function buildBandTargetsPerPosition(
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
  prevTierTargets?: readonly number[] | null,
): number[] | null {
  const rankIdx = bandTier - 1
  const targets: number[] = []
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos)
    const sorted = [...forPos].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      return bandIndexFromRow(a) - bandIndexFromRow(b)
    })
    if (sorted.length === 0) return null
    const effRank =
      bandTier <= 3 ? effectiveBandRankIdx(sorted, rankIdx) : rankIdx
    const picked = pickBandIndexForPosition(sorted, effRank)
    if (picked === null) return null
    targets.push(picked)
  }
  if (prevTierTargets) {
    return differentiateBandTargetsFromPrev(targets, prevTierTargets)
  }
  return targets
}

function setKey(nums: number[]): string {
  return [...nums].sort((a, b) => a - b).join(',')
}

const COMBO_STRATEGY_RE = /^combo:oe(\d+)-run(\d+)-band(\d+)$/

export function parseComboStrategyRanks(strategy: string | undefined): [number, number, number] {
  if (!strategy) return [999, 999, 999]
  const m = COMBO_STRATEGY_RE.exec(strategy)
  if (!m) return [999, 999, 999]
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

export function sortGeneratedSetsByComboStrategy(sets: readonly GeneratedSet[]): GeneratedSet[] {
  return [...sets].sort((x, y) => {
    const [a1, a2, a3] = parseComboStrategyRanks(x.strategy)
    const [b1, b2, b3] = parseComboStrategyRanks(y.strategy)
    if (a1 !== b1) return a1 - b1
    if (a2 !== b2) return a2 - b2
    if (a3 !== b3) return a3 - b3
    return setKey([x.num1, x.num2, x.num3, x.num4, x.num5, x.num6]).localeCompare(
      setKey([y.num1, y.num2, y.num3, y.num4, y.num5, y.num6]),
    )
  })
}

function comboStrategyForTriple(oe: number, run: number, band: number): string {
  return `combo:oe${oe}-run${run}-band${band}`
}

/** 저장 API 응답 등을 고정 20슬롯 순서로 맞춘다(동일 조합 라벨 중복 허용) */
export function orderSetsByProfileSlots(sets: readonly GeneratedSet[]): GeneratedSet[] {
  const remaining = [...sets]
  const ordered: GeneratedSet[] = []
  for (const [oe, run, band] of COMBO_PROFILE_SLOT_ORDER) {
    const want = comboStrategyForTriple(oe, run, band)
    const idx = remaining.findIndex((s) => s.strategy === want)
    if (idx < 0) continue
    ordered.push(remaining[idx]!)
    remaining.splice(idx, 1)
  }
  return [...ordered, ...remaining]
}

export function formatProfileTriple(oe: number, run: number, band: number): string {
  return `oe${oe}-run${run}-band${band}`
}

/** 고정 20슬롯 순서대로 채워진 세트만 반환 */
export function setsInProfileSlotOrder(slots: readonly (GeneratedSet | null)[]): GeneratedSet[] {
  const out: GeneratedSet[] = []
  for (const s of slots) {
    if (s) out.push(s)
  }
  return out
}

function toGeneratedSet(nums: number[], strategy: string): GeneratedSet {
  const s = [...nums].sort((a, b) => a - b)
  return {
    num1: s[0],
    num2: s[1],
    num3: s[2],
    num4: s[3],
    num5: s[4],
    num6: s[5],
    method: METHOD_JL,
    strategy,
  }
}

function bumpUsage(
  sorted: readonly number[],
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
): void {
  for (const n of sorted) {
    usage.set(n, (usage.get(n) ?? 0) + 1)
    const key = innerSlotKey(n)
    innerSlotUsage.set(key, (innerSlotUsage.get(key) ?? 0) + 1)
  }
}

async function findOneSetForRanks(
  poolByBand: ReadonlyMap<number, number[]>,
  minSum: number,
  maxSum: number,
  oddRank: number,
  consecRank: number,
  bandTier: number,
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  consecRows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  bandTargets: readonly number[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage }
  const evenT = evenCountAtRank(oddRows, oddRank)
  const runT = maxRunAtRank(consecRows, consecRank)
  if (evenT === null || runT === null) return null
  if (bandTargets.length !== 6) return null

  const constraints: ProfileConstraints = {
    minSum,
    maxSum,
    evenT,
    runT,
    bandTargets,
  }

  if (repairYieldEvery > 0) {
    await yieldToMain()
  }

  const built = buildOneSetWithFallback(
    poolByBand,
    constraints,
    pickCtx,
    PROFILE_BUILD_ATTEMPTS,
  )
  if (!built) return null

  const baseStrategy = `combo:oe${oddRank}-run${consecRank}-band${bandTier}`
  let sorted = built.sorted
  let key = setKey(sorted)
  if (usedKeys.has(key)) {
    for (let i = 0; i < PROFILE_BUILD_ATTEMPTS; i++) {
      const picked = randomPerPositionPick(poolByBand, bandTargets, pickCtx)
      if (!picked) continue
      sorted = sortPickedAsc(picked)
      key = setKey(sorted)
      if (!usedKeys.has(key)) break
    }
    if (usedKeys.has(key)) {
      const metrics = buildMetricsOnlyFromPool(
        poolByBand,
        constraints,
        pickCtx,
        PROFILE_BUILD_ATTEMPTS,
      )
      if (metrics) {
        sorted = metrics
        key = setKey(sorted)
      }
    }
    if (usedKeys.has(key)) return null
  }

  usedKeys.add(key)
  bumpUsage(sorted, usage, innerSlotUsage)
  return toGeneratedSet(sorted, baseStrategy)
}

export type CombinationGenerationResult = {
  sets: GeneratedSet[]
  summaryLines: string[]
  warning: string | null
}

type FillCtx = {
  poolByBand: ReadonlyMap<number, number[]>
  minSum: number
  maxSum: number
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows']
  consecRows: ReturnType<typeof buildConsecutiveRunDistribution>['rows']
  targetsByBandTier: [number[], number[], number[]]
  usedKeys: Set<string>
  usage: Map<number, number>
  innerSlotUsage: Map<string, number>
  repairYieldEvery: number
  profileSlots: (GeneratedSet | null)[]
}

async function tryFillOneSlot(ctx: FillCtx, slot: number): Promise<boolean> {
  if (ctx.profileSlots[slot]) return false
  const triple = COMBO_PROFILE_SLOT_ORDER[slot]
  if (!triple) return false
  const [oe, run, band] = triple

  const bandTargets = ctx.targetsByBandTier[band - 1]
  const one = await findOneSetForRanks(
    ctx.poolByBand,
    ctx.minSum,
    ctx.maxSum,
    oe,
    run,
    band,
    ctx.oddRows,
    ctx.consecRows,
    bandTargets,
    ctx.usedKeys,
    ctx.usage,
    ctx.innerSlotUsage,
    ctx.repairYieldEvery,
  )
  if (!one) return false

  ctx.profileSlots[slot] = one
  return true
}

async function fillTargetProfiles(ctx: FillCtx): Promise<number> {
  let gained = 0
  for (let slot = 0; slot < COMBO_PROFILE_SLOT_ORDER.length; slot++) {
    if (await tryFillOneSlot(ctx, slot)) gained++
  }
  return gained
}

const FAILURE_REASON_KO: Record<ProfileFailureReason, string> = {
  ok: '',
  rank_unavailable: '홀짝·연속 랭크 통계 부족',
  no_band_in_pool:
    '채택 풀에 자리 band 후보가 없고, 합·홀짝·연속만 맞추는 조합도 없음',
  constraints_unsat: '합·홀짝·연속·자리대를 동시에 맞출 조합 없음(탐색 한도 내)',
  duplicate_only: '조건은 맞지만 이미 만든 6개 번호 조합과 중복',
}

function profileFailureSummary(
  ctx: FillCtx,
  oe: number,
  run: number,
  band: number,
): string | null {
  const evenT = evenCountAtRank(ctx.oddRows, oe)
  const runT = maxRunAtRank(ctx.consecRows, run)
  if (evenT === null || runT === null) {
    return FAILURE_REASON_KO.rank_unavailable
  }
  const bandTargets = ctx.targetsByBandTier[band - 1]
  const constraints: ProfileConstraints = {
    minSum: ctx.minSum,
    maxSum: ctx.maxSum,
    evenT,
    runT,
    bandTargets,
  }
  const reason = diagnoseProfileBuild(
    ctx.poolByBand,
    constraints,
    ctx.usedKeys,
    { usage: ctx.usage, innerSlotUsage: ctx.innerSlotUsage },
    { allowBacktrack: true, bandTier: band, lightOe: oe >= OE_RANK_LIGHT },
  )
  return FAILURE_REASON_KO[reason] || null
}

function appendMissingProfileDiagnostics(ctx: FillCtx, summaryLines: string[]): void {
  const missingSlots: number[] = []
  for (let slot = 0; slot < COMBO_PROFILE_SLOT_ORDER.length; slot++) {
    if (!ctx.profileSlots[slot]) missingSlots.push(slot)
  }
  if (missingSlots.length === 0) return
  summaryLines.push(`미생성 슬롯 ${missingSlots.length}개:`)
  for (const slot of missingSlots) {
    const [oe, run, band] = COMBO_PROFILE_SLOT_ORDER[slot]!
    const detail = profileFailureSummary(ctx, oe, run, band)
    summaryLines.push(
      `  · ${slot + 1}. oe${oe}-run${run}-band${band}: ${detail ?? '알 수 없음'}`,
    )
  }
}

/**
 * 통합 채택 풀 + 전체 이력 통계로 조합 세트를 최대 TARGET_SET_COUNT개 생성.
 * 각 프로필마다 band 목표 구간에서 자리별 6개 추출 후, 합·홀짝·연속을
 * PROFILE_BUILD_ATTEMPTS회만 맞춘다. 폴백: 합 제외 홀짝·연속 둘 다 → 둘 중 1개 이상.
 */
export async function generateCombinationBasedSets(
  fullHistory: readonly WinningNumberRow[],
  adoptedPool: readonly number[],
  referenceDrawNo: number,
  repairYieldEvery: number = DEFAULT_REPAIR_YIELD_EVERY,
): Promise<CombinationGenerationResult> {
  const summaryLines: string[] = []
  if (adoptedPool.length < 6) {
    return {
      sets: [],
      summaryLines: ['채택 번호가 6개 미만이라 세트를 만들 수 없습니다.'],
      warning: '채택 풀 부족',
    }
  }

  const sortedHistory = [...fullHistory].sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains)
  const sumStats = buildSumExtremeStats(sortedHistory)
  if (!sumStats || sumStats.trimmedMinSum === null || sumStats.trimmedMaxSum === null) {
    return {
      sets: [],
      summaryLines: ['고저 합산 통계를 계산할 수 없어 세트를 만들 수 없습니다.'],
      warning: '합산 극단 통계 없음',
    }
  }
  const minSum = sumStats.trimmedMinSum
  const maxSum = sumStats.trimmedMaxSum

  const oddEven = buildOddEvenDistribution(sortedHistory)
  const consecutive = buildConsecutiveRunDistribution(sortedHistory)
  const positionBand = buildPositionBandDistribution(sortedHistory)

  summaryLines.push(
    `고저 합산 허용 구간: ${minSum} ~ ${maxSum} (전체 ${sumStats.totalDraws}회차 기준 극단 제외 후)`,
  )

  const poolSorted = [...new Set(adoptedPool)].filter((n) => n >= 1 && n <= 45).sort((a, b) => a - b)
  if (poolSorted.length < 6) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '유효 채택 번호가 6개 미만입니다.'],
      warning: '채택 풀 부족',
    }
  }

  const poolByBand = buildPoolByBand(poolSorted)

  const usage = new Map<number, number>()
  for (const n of poolSorted) usage.set(n, 0)
  const innerSlotUsage = new Map<string, number>()

  const usedKeys = new Set<string>()
  const t1 = buildBandTargetsPerPosition(positionBand.rows, 1)
  const t2 = t1 ? buildBandTargetsPerPosition(positionBand.rows, 2, t1) : null
  const t3 = t2 ? buildBandTargetsPerPosition(positionBand.rows, 3, t2) : null
  if (!t1 || !t2 || !t3) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '자리별 번호대 통계를 해석할 수 없어 세트를 만들 수 없습니다.'],
      warning: '자리대 통계 없음',
    }
  }
  const targetsByBandTier: [number[], number[], number[]] = [t1, t2, t3]

  const profileSlots: (GeneratedSet | null)[] = Array.from(
    { length: COMBO_PROFILE_SLOT_ORDER.length },
    () => null,
  )

  const ctx: FillCtx = {
    poolByBand,
    minSum,
    maxSum,
    oddRows: oddEven.rows,
    consecRows: consecutive.rows,
    targetsByBandTier,
    usedKeys,
    usage,
    innerSlotUsage,
    repairYieldEvery,
    profileSlots,
  }

  for (let round = 0; round < MAX_PRIORITY_ROUNDS; round++) {
    const gained = await fillTargetProfiles(ctx)
    if (gained === 0) break
    if (profileSlots.every((s) => s !== null)) break
  }

  appendMissingProfileDiagnostics(ctx, summaryLines)

  const sets = setsInProfileSlotOrder(profileSlots)

  summaryLines.push(
    `세트 구성: 고정 ${TARGET_SET_COUNT}슬롯(15패턴+5, band1~3·자리별 ${MIN_BAND_TIER_PERCENT}% 미만 N등→1등)·통합 채택 풀·슬롯당 ${PROFILE_BUILD_ATTEMPTS}회·${sets.length}개.`,
  )

  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 채택 풀·제약을 확인해 주세요.`
      : null
  if (warning) summaryLines.push(warning)

  summaryLines.push(`생성 세트 수: ${sets.length}`)

  return { sets, summaryLines, warning }
}
