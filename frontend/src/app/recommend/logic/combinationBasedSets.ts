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

const METHOD_JL = 'JL Wheel Method'

/** 추천 페이지에서 생성·저장할 목표 세트 수 */
export const TARGET_SET_COUNT = 30

/**
 * (oddRank, consecRank, bandTier) 우선순위 — 숫자가 작을수록 높은 순위.
 * band1~3: 각 당첨번호 **자리(1~6)**마다 번호대(1~9, 10~19, …) 비율을 내림차순 정렬했을 때 **1·2·3등 구간 하나만** 정확히 맞춘다.
 * 어떤 자리에서 3등이 없으면 그 자리만 1등 구간을 쓴다.
 * 30세트가 부족하면 이 순서를 **여러 라운드** 반복한다(합·랭크 제약 유지).
 * 한 라운드에서 하나도 추가되지 않으면 중단한다.
 */
const MAX_PRIORITY_ROUNDS = 24

/** 자리대 band 차원: 1, 2, 3만 사용(기존 삼중항 구조 유지) */
const BAND_TIER_MIN = 1
const BAND_TIER_MAX = 3

function buildOrderedRankTriples(): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let a = 1; a <= 7; a++) {
    for (let b = 1; b <= 6; b++) {
      for (let c = BAND_TIER_MIN; c <= BAND_TIER_MAX; c++) {
        out.push([a, b, c])
      }
    }
  }
  return out
}

const ORDERED_RANK_TRIPLES = buildOrderedRankTriples()

/**
 * 랭크 후보로 쓸 분포 행의 최소 비율(초과만 허용).
 * 10% 이하(≤10.00)는 제외하고, 10.1% 같은 값은 사용한다.
 */
const MIN_RANKABLE_PERCENT = 10

/** 기존 세트와의 최대 겹침(주6 교집합 크기)에 대한 점수 가중 — 제곱과 곱해 과도한 번호 중복을 억제 */
const OVERLAP_PENALTY_WEIGHT = 32

/**
 * 긴 C(n,6) 순회로 메인 스레드가 막히면 Chrome이 '페이지 나가기/대기' 대화상자를 띄운다.
 * 일정 간격으로 이벤트 루프에 양보해 UI·fetch가 응답 가능하게 유지한다.
 */
const DEFAULT_COMBO_YIELD_EVERY = 4096

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

/** 조합 페이지 주석(오름차순 주6)과 생성 검증을 맞추기 위해 당첨 행 본번호를 정렬해 둔다. */
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

/** 정렬된 주6에서 인접 차이 1인 구간 중 최장 길이(최소 1) */
function maxConsecutiveRunLength(sorted: readonly number[]): number {
  let maxRun = 1
  let current = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      current++
    } else {
      if (current > maxRun) maxRun = current
      current = 1
    }
  }
  if (current > maxRun) maxRun = current
  return maxRun
}

function bandIndexFromRow(row: PositionBandDistributionRow): number {
  const idx = NUMBER_BAND_LABELS.indexOf(row.bandLabel as (typeof NUMBER_BAND_LABELS)[number])
  return idx >= 0 ? idx : 0
}

/** 비율 내림차순, 동률 시 보조키 오름차순으로 정렬된 순서에서 rank(1기반)에 해당하는 값 */
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

/**
 * 자리(1~6)마다 번호대별 비율 내림차순 정렬 후, bandTier등(1~3)에 해당하는 번호대 인덱스(0~4) 하나씩.
 * band3인데 해당 자리에 3등 행이 없으면 그 자리만 1등 구간 인덱스를 쓴다(2등 부재도 동일하게 1등).
 */
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

function matchesProfile(
  sortedSix: number[],
  evenTarget: number,
  runTarget: number,
  bandTargets: readonly number[],
): boolean {
  if (sortedSix.filter((n) => n % 2 === 0).length !== evenTarget) return false
  if (maxConsecutiveRunLength(sortedSix) !== runTarget) return false
  if (bandTargets.length !== 6) return false
  for (let i = 0; i < 6; i++) {
    if (numberToBandIndex(sortedSix[i]) !== bandTargets[i]) return false
  }
  return true
}

function setKey(nums: number[]): string {
  return [...nums].sort((a, b) => a - b).join(',')
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

/** 낮을수록 덜 쓰인 번호 위주의 조합(세트 간 다양화) */
function diversityScore(sorted: readonly number[], usage: ReadonlyMap<number, number>): number {
  let s = 0
  for (const n of sorted) {
    const c = usage.get(n) ?? 0
    s += c * c
  }
  return s
}

function sortedSixFromGeneratedSet(s: GeneratedSet): number[] {
  return [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((a, b) => a - b)
}

function intersectionSizeSorted(a: readonly number[], b: readonly number[]): number {
  let i = 0
  let j = 0
  let c = 0
  while (i < 6 && j < 6) {
    if (a[i] === b[j]) {
      c++
      i++
      j++
    } else if (a[i] < b[j]) {
      i++
    } else {
      j++
    }
  }
  return c
}

/** 사용 빈도 + 이미 뽑은 세트와의 최대 겹침(낮을수록 유리한 후보) */
function pickScore(
  sorted: readonly number[],
  usage: ReadonlyMap<number, number>,
  chosenSortedSixes: readonly number[][],
): number {
  let maxOv = 0
  for (const six of chosenSortedSixes) {
    const o = intersectionSizeSorted(sorted, six)
    if (o > maxOv) maxOv = o
  }
  return diversityScore(sorted, usage) + OVERLAP_PENALTY_WEIGHT * maxOv * maxOv
}

function lexLess(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < 6; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return false
}

function isBetterPick(
  score: number,
  sorted: number[],
  bestScore: number,
  best: number[] | null,
): boolean {
  if (best === null) return true
  if (score < bestScore) return true
  if (score > bestScore) return false
  return lexLess(sorted, best)
}

function bumpUsage(sorted: readonly number[], usage: Map<number, number>): void {
  for (const n of sorted) {
    usage.set(n, (usage.get(n) ?? 0) + 1)
  }
}

/** C(n,6) 순회 — 결정론적 순서(오름차순 인덱스 조합). yieldEvery>0이면 주기적으로 메인 스레드 양보 */
async function forEachCombination6(
  poolSorted: number[],
  fn: (combo: number[]) => void,
  yieldEvery: number,
): Promise<void> {
  const n = poolSorted.length
  if (n < 6) return
  const idx = [0, 1, 2, 3, 4, 5]
  let done = false
  let seen = 0
  while (!done) {
    fn(idx.map((i) => poolSorted[i]))
    seen++
    if (yieldEvery > 0 && seen % yieldEvery === 0) {
      await yieldToMain()
    }
    let k = 5
    while (k >= 0 && idx[k] === k + n - 6) k--
    if (k < 0) {
      done = true
    } else {
      idx[k] += 1
      for (let j = k + 1; j < 6; j++) {
        idx[j] = idx[j - 1] + 1
      }
    }
  }
}

async function findOneSetForRanks(
  poolSorted: number[],
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
  priorChosen: readonly GeneratedSet[],
  yieldEvery: number,
): Promise<GeneratedSet | null> {
  const evenT = evenCountAtRank(oddRows, oddRank)
  const runT = maxRunAtRank(consecRows, consecRank)
  if (evenT === null || runT === null) return null
  if (bandTargets.length !== 6) return null

  const chosenSixes = priorChosen.map(sortedSixFromGeneratedSet)
  let best: number[] | null = null
  let bestScore = Infinity
  await forEachCombination6(
    poolSorted,
    (combo) => {
      const sorted = [...combo].sort((a, b) => a - b)
      const sum = sorted.reduce((a, b) => a + b, 0)
      if (sum < minSum || sum > maxSum) return
      if (!matchesProfile(sorted, evenT, runT, bandTargets)) return
      const key = setKey(sorted)
      if (usedKeys.has(key)) return
      const sc = pickScore(sorted, usage, chosenSixes)
      if (isBetterPick(sc, sorted, bestScore, best)) {
        bestScore = sc
        best = sorted
      }
    },
    yieldEvery,
  )

  if (!best) return null
  usedKeys.add(setKey(best))
  bumpUsage(best, usage)
  return toGeneratedSet(best, `combo:oe${oddRank}-run${consecRank}-band${bandTier}`)
}

export type CombinationGenerationResult = {
  sets: GeneratedSet[]
  /** UI·저장용 메타 */
  summaryLines: string[]
  warning: string | null
}

/**
 * 전체 당첨 이력 + 통합 채택 풀로 조합 분석 제약을 만족하는 세트를 최대 TARGET_SET_COUNT개까지 생성.
 * 고저 합산 허용 구간은 모든 세트에 공통으로 적용한다.
 * 홀짝·연속 랭크는 비율 10% 초과 범주만 쓴다. 자리대는 band1~3으로 자리마다 비율 1·2·3등 **구간 하나**만 정확히 맞추고, 3등이 없는 자리는 1등 구간만 쓴다.
 * 30개가 모자라면 (홀짝·연속·band) 우선순위 삼중항 순서를 라운드 반복해 추가한다(진전 없으면 중단).
 * 후보는 사용 빈도와 기존 세트와의 겹침(교집합) 패널티로 고른다.
 * @param comboYieldEvery C(n,6) 순회 중 몇 회마다 메인 스레드에 양보할지(0이면 양보 없음·테스트용)
 */
export async function generateCombinationBasedSets(
  fullHistory: readonly WinningNumberRow[],
  adoptedPool: readonly number[],
  comboYieldEvery: number = DEFAULT_COMBO_YIELD_EVERY,
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

  const usage = new Map<number, number>()
  for (const n of poolSorted) usage.set(n, 0)

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
    for (const [a, b, c] of ORDERED_RANK_TRIPLES) {
      if (sets.length >= TARGET_SET_COUNT) break
      const bandTargets = targetsByBandTier[c - 1]
      const one = await findOneSetForRanks(
        poolSorted,
        minSum,
        maxSum,
        a,
        b,
        c,
        oddEven.rows,
        consecutive.rows,
        bandTargets,
        usedKeys,
        usage,
        sets,
        comboYieldEvery,
      )
      if (one) sets.push(one)
    }
    if (sets.length === countBeforeRound) break
  }

  summaryLines.push(
    `세트 구성: 홀짝·연속·자리대(band1~3=자리별 비율 1·2·3등 구간 단일 매칭, 3등 없으면 해당 자리 1등) ${sets.length}개 (우선순위 라운드 최대 ${MAX_PRIORITY_ROUNDS}회·고저 합 구간 공통 적용).`,
  )

  const warning =
    sets.length < TARGET_SET_COUNT
      ? `제약·합산 구간 내에서 조합이 ${sets.length}개까지만 확보되었습니다(목표 ${TARGET_SET_COUNT}).`
      : null
  if (warning) summaryLines.push(warning)

  summaryLines.push(`생성 세트 수: ${sets.length}`)

  return { sets, summaryLines, warning }
}
