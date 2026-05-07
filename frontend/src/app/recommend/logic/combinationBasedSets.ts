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
  const sorted = [...rows].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.evenCount - b.evenCount
  })
  return sorted[rank1 - 1]?.evenCount ?? null
}

function maxRunAtRank(
  rows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  rank1: number,
): number | null {
  const sorted = [...rows].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.maxRunLength - b.maxRunLength
  })
  const v = sorted[rank1 - 1]?.maxRunLength
  return v !== undefined ? v : null
}

/** 자리(1~6)마다 rank번째로 높은 비율의 번호대 인덱스(0~4) */
function bandIndicesAtRank(
  flat: readonly PositionBandDistributionRow[],
  rank1: number,
): number[] | null {
  if (rank1 < 1) return null
  const out: number[] = []
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos)
    const sorted = [...forPos].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      return bandIndexFromRow(a) - bandIndexFromRow(b)
    })
    const picked = sorted[rank1 - 1]
    if (!picked) return null
    out.push(bandIndexFromRow(picked))
  }
  return out
}

function matchesProfile(
  sortedSix: number[],
  evenTarget: number,
  runTarget: number,
  bandTargets: readonly number[],
): boolean {
  if (sortedSix.filter((n) => n % 2 === 0).length !== evenTarget) return false
  if (maxConsecutiveRunLength(sortedSix) !== runTarget) return false
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
  bandRank: number,
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  consecRows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  flatBands: readonly PositionBandDistributionRow[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  yieldEvery: number,
): Promise<GeneratedSet | null> {
  const evenT = evenCountAtRank(oddRows, oddRank)
  const runT = maxRunAtRank(consecRows, consecRank)
  const bands = bandIndicesAtRank(flatBands, bandRank)
  if (evenT === null || runT === null || bands === null) return null

  let best: number[] | null = null
  let bestScore = Infinity
  await forEachCombination6(
    poolSorted,
    (combo) => {
      const sorted = [...combo].sort((a, b) => a - b)
      const sum = sorted.reduce((a, b) => a + b, 0)
      if (sum < minSum || sum > maxSum) return
      if (!matchesProfile(sorted, evenT, runT, bands)) return
      const key = setKey(sorted)
      if (usedKeys.has(key)) return
      const sc = diversityScore(sorted, usage)
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
  return toGeneratedSet(best, `combo:oe${oddRank}-run${consecRank}-band${bandRank}`)
}

async function collectSetsForRank(
  poolSorted: number[],
  minSum: number,
  maxSum: number,
  oddRank: number,
  consecRank: number,
  bandRank: number,
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  consecRows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  flatBands: readonly PositionBandDistributionRow[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  need: number,
  yieldEvery: number,
): Promise<GeneratedSet[]> {
  const out: GeneratedSet[] = []
  const evenT = evenCountAtRank(oddRows, oddRank)
  const runT = maxRunAtRank(consecRows, consecRank)
  const bands = bandIndicesAtRank(flatBands, bandRank)
  if (evenT === null || runT === null || bands === null) return out

  while (out.length < need) {
    let best: number[] | null = null
    let bestScore = Infinity
    await forEachCombination6(
      poolSorted,
      (combo) => {
        const sorted = [...combo].sort((a, b) => a - b)
        const sum = sorted.reduce((a, b) => a + b, 0)
        if (sum < minSum || sum > maxSum) return
        if (!matchesProfile(sorted, evenT, runT, bands)) return
        const key = setKey(sorted)
        if (usedKeys.has(key)) return
        const sc = diversityScore(sorted, usage)
        if (isBetterPick(sc, sorted, bestScore, best)) {
          bestScore = sc
          best = sorted
        }
      },
      yieldEvery,
    )
    if (!best) break
    usedKeys.add(setKey(best))
    bumpUsage(best, usage)
    out.push(toGeneratedSet(best, `combo:oe${oddRank}-run${consecRank}-band${bandRank}`))
  }
  return out
}

/** 합산 구간만 만족하는 조합으로 목표 개수까지 보충(동일 다양화 점수) */
async function fillSetsSumRangeOnly(
  poolSorted: number[],
  minSum: number,
  maxSum: number,
  usedKeys: Set<string>,
  usage: Map<number, number>,
  sets: GeneratedSet[],
  target: number,
  yieldEvery: number,
): Promise<number> {
  let added = 0
  while (sets.length < target) {
    let best: number[] | null = null
    let bestScore = Infinity
    await forEachCombination6(
      poolSorted,
      (combo) => {
        const sorted = [...combo].sort((a, b) => a - b)
        const sum = sorted.reduce((a, b) => a + b, 0)
        if (sum < minSum || sum > maxSum) return
        const key = setKey(sorted)
        if (usedKeys.has(key)) return
        const sc = diversityScore(sorted, usage)
        if (isBetterPick(sc, sorted, bestScore, best)) {
          bestScore = sc
          best = sorted
        }
      },
      yieldEvery,
    )
    if (!best) break
    usedKeys.add(setKey(best))
    bumpUsage(best, usage)
    sets.push(toGeneratedSet(best, 'combo:sum-range-fill'))
    added++
  }
  return added
}

export type CombinationGenerationResult = {
  sets: GeneratedSet[]
  /** UI·저장용 메타 */
  summaryLines: string[]
  warning: string | null
}

/**
 * 전체 당첨 이력 + 통합 채택 풀로 조합 분석 제약을 만족하는 세트를 최대 TARGET_SET_COUNT개까지 생성.
 * 랭크 제약만으로 부족하면 합산 구간만으로 보충하며, 후보는 사용 빈도 기반으로 고른다.
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

  const topTier = await collectSetsForRank(
    poolSorted,
    minSum,
    maxSum,
    1,
    1,
    1,
    oddEven.rows,
    consecutive.rows,
    positionBand.rows,
    usedKeys,
    usage,
    5,
    comboYieldEvery,
  )
  sets.push(...topTier)

  const restTriples: [number, number, number][] = []
  for (let a = 1; a <= 7; a++) {
    for (let b = 1; b <= 6; b++) {
      for (let c = 1; c <= 5; c++) {
        if (a === 1 && b === 1 && c === 1) continue
        restTriples.push([a, b, c])
      }
    }
  }

  for (const [a, b, c] of restTriples) {
    if (sets.length >= TARGET_SET_COUNT) break
    const one = await findOneSetForRanks(
      poolSorted,
      minSum,
      maxSum,
      a,
      b,
      c,
      oddEven.rows,
      consecutive.rows,
      positionBand.rows,
      usedKeys,
      usage,
      comboYieldEvery,
    )
    if (one) sets.push(one)
  }

  const strictCount = sets.length
  const fillAdded = await fillSetsSumRangeOnly(
    poolSorted,
    minSum,
    maxSum,
    usedKeys,
    usage,
    sets,
    TARGET_SET_COUNT,
    comboYieldEvery,
  )

  summaryLines.push(
    `세트 구성: 조합 랭크 제약 ${strictCount}개${fillAdded > 0 ? `, 합산 구간 보충 ${fillAdded}개` : ''}.`,
  )

  const warning =
    sets.length < TARGET_SET_COUNT
      ? `제약·합산 구간 내에서 조합이 ${sets.length}개까지만 확보되었습니다(목표 ${TARGET_SET_COUNT}).`
      : null
  if (warning) summaryLines.push(warning)

  summaryLines.push(`생성 세트 수: ${sets.length}`)

  return { sets, summaryLines, warning }
}
