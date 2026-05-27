import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { buildConsecutiveRunDistribution } from '@/app/analysis/combination/logic/buildConsecutiveRunDistribution'
import { buildOddEvenDistribution } from '@/app/analysis/combination/logic/buildOddEvenDistribution'
import {
  buildPositionBandDistribution,
  NUMBER_BAND_LABELS,
  numberToBandIndex,
} from '@/app/analysis/combination/logic/buildPositionBandDistribution'
import { buildSumExtremeStats } from '@/app/analysis/combination/logic/buildSumExtremeStats'
import type { PositionBandDistributionRow } from '@/app/analysis/combination/types'
import type { GeneratedSet } from '@/app/recommend/logic/types'
import {
  buildHistCounts,
  buildPoolByBand,
  tryBuildOneSet,
  type ProfileConstraints,
} from '@/app/recommend/logic/combinationBandRepair'

const METHOD_JL = 'JL Wheel Method'

/** 추천 페이지에서 생성·저장할 목표 세트 수 */
export const TARGET_SET_COUNT = 20

/**
 * (oddRank, consecRank, bandTier) 우선순위 — 숫자가 작을수록 높은 순위.
 * band1~3: 각 당첨번호 **자리(1~6)**마다 번호대(1~5, 6~10, …) 비율을 내림차순 정렬했을 때 **1·2·3등 구간 하나만** 정확히 맞춘다.
 */
const MAX_PRIORITY_ROUNDS = 24

const BAND_TIER_MIN = 1
const BAND_TIER_MAX = 3

function buildComboRankTriplePriorityOrder(): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let oe = 1; oe <= 7; oe++) {
    for (let run = 1; run <= 6; run++) {
      for (let band = BAND_TIER_MIN; band <= BAND_TIER_MAX; band++) {
        out.push([oe, run, band])
      }
    }
  }
  return out
}

export const COMBO_RANK_TRIPLE_PRIORITY_ORDER = buildComboRankTriplePriorityOrder()

const MIN_RANKABLE_PERCENT = 10

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
  return bandIndex * 5 + 1
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

function buildBandTargetsPerPosition(
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
): number[] | null {
  const rankIdx = bandTier - 1
  const targets: number[] = []
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos)
    const sorted = [...forPos].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      return bandIndexFromRow(a) - bandIndexFromRow(b)
    })
    const top = sorted[0]
    if (!top) return null
    const picked = sorted[rankIdx]
    targets.push(bandIndexFromRow(picked ?? top))
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
  histCounts: readonly number[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> {
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
  const sorted = tryBuildOneSet(poolByBand, constraints, histCounts)
  if (!sorted) return null

  const key = setKey(sorted)
  if (usedKeys.has(key)) return null

  const baseStrategy = `combo:oe${oddRank}-run${consecRank}-band${bandTier}`
  usedKeys.add(key)
  bumpUsage(sorted, usage, innerSlotUsage)
  return toGeneratedSet(sorted, baseStrategy)
}

export type CombinationGenerationResult = {
  sets: GeneratedSet[]
  summaryLines: string[]
  warning: string | null
}

/**
 * 통합 채택 풀 + 전체 이력 통계로 조합 세트를 최대 TARGET_SET_COUNT개 생성.
 * 각 프로필마다 band 목표 구간에서 랜덤 6개 시드 후, 합·홀짝·연속 불일치 시
 * 해당 자리 band 구간 안에서 기준 회차 이전 누적 출현이 적은 번호로 교체한다.
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

  const histCounts = buildHistCounts(sortedHistory, referenceDrawNo)
  const poolByBand = buildPoolByBand(poolSorted)

  const usage = new Map<number, number>()
  for (const n of poolSorted) usage.set(n, 0)
  const innerSlotUsage = new Map<string, number>()

  const usedKeys = new Set<string>()
  const sets: GeneratedSet[] = []
  const t1 = buildBandTargetsPerPosition(positionBand.rows, 1)
  const t2 = buildBandTargetsPerPosition(positionBand.rows, 2)
  const t3 = buildBandTargetsPerPosition(positionBand.rows, 3)
  if (!t1 || !t2 || !t3) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '자리별 번호대 통계를 해석할 수 없어 세트를 만들 수 없습니다.'],
      warning: '자리대 통계 없음',
    }
  }
  const targetsByBandTier: [number[], number[], number[]] = [t1, t2, t3]

  for (let round = 0; round < MAX_PRIORITY_ROUNDS && sets.length < TARGET_SET_COUNT; round++) {
    const countBeforeRound = sets.length
    for (const [a, b, c] of COMBO_RANK_TRIPLE_PRIORITY_ORDER) {
      if (sets.length >= TARGET_SET_COUNT) break
      const bandTargets = targetsByBandTier[c - 1]
      const one = await findOneSetForRanks(
        poolByBand,
        minSum,
        maxSum,
        a,
        b,
        c,
        oddEven.rows,
        consecutive.rows,
        bandTargets,
        histCounts,
        usedKeys,
        usage,
        innerSlotUsage,
        repairYieldEvery,
      )
      if (one) sets.push(one)
    }
    if (sets.length === countBeforeRound) break
  }

  summaryLines.push(
    `세트 구성: 통합 채택 번호만 사용·자리별 band 구간 랜덤 시드 후 합·홀짝·연속 맞춤(교체 시 ${referenceDrawNo}회차 미만 누적 출현 최소·동일 자리 band 구간)·${sets.length}개 (우선순위 라운드 최대 ${MAX_PRIORITY_ROUNDS}회).`,
  )

  const warning =
    sets.length < TARGET_SET_COUNT
      ? `제약·합산 구간 내에서 조합이 ${sets.length}개까지만 확보되었습니다(목표 ${TARGET_SET_COUNT}).`
      : null
  if (warning) summaryLines.push(warning)

  summaryLines.push(`생성 세트 수: ${sets.length}`)

  return { sets: sortGeneratedSetsByComboStrategy(sets), summaryLines, warning }
}
