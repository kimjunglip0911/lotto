import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand'

/** 교체 루프 최대 스텝(시드 1회당) */
export const MAX_REPAIR_STEPS = 300

/** 프로필당 랜덤 시드 재시도 상한(Monte Carlo 전수 아님) */
export const MAX_SEED_ATTEMPTS = 48

export type SetViolation = 'sum_high' | 'sum_low' | 'even' | 'run' | 'band'

export type ProfileConstraints = {
  minSum: number
  maxSum: number
  evenT: number
  runT: number
  bandTargets: readonly number[]
}

export type ValidateResult = {
  ok: boolean
  violations: SetViolation[]
}

/** 기준 회차 미만 이력에서 본번호 6개만 집계한 1~45 출현 횟수 */
export function buildHistCounts(
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): number[] {
  const counts = Array.from({ length: 45 }, () => 0)
  for (const row of rows) {
    if (row.draw_no >= referenceDrawNo) continue
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6]
    for (const n of mains) {
      if (n >= 1 && n <= 45) counts[n - 1]++
    }
  }
  return counts
}

/** 채택 풀 번호를 5단위 bandIndex(0~8)별로 묶는다 */
export function buildPoolByBand(poolSorted: readonly number[]): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const n of poolSorted) {
    const b = numberToBandIndex(n)
    const list = map.get(b) ?? []
    list.push(n)
    map.set(b, list)
  }
  return map
}

/** 정렬된 주6에서 인접 차이 1인 구간 중 최장 길이(최소 1) */
export function maxConsecutiveRunLength(sorted: readonly number[]): number {
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

export function validateSet(sorted: readonly number[], constraints: ProfileConstraints): ValidateResult {
  const violations: SetViolation[] = []
  const sum = sorted.reduce((a, b) => a + b, 0)
  if (sum > constraints.maxSum) violations.push('sum_high')
  if (sum < constraints.minSum) violations.push('sum_low')
  const evens = sorted.filter((n) => n % 2 === 0).length
  if (evens !== constraints.evenT) violations.push('even')
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run')
  for (let i = 0; i < 6; i++) {
    if (numberToBandIndex(sorted[i]) !== constraints.bandTargets[i]) {
      violations.push('band')
      break
    }
  }
  return { ok: violations.length === 0, violations }
}

function violationRank(v: SetViolation): number {
  if (v === 'band') return 0
  if (v === 'sum_high' || v === 'sum_low') return 1
  if (v === 'even') return 2
  return 3
}

function compareViolationSets(a: readonly SetViolation[], b: readonly SetViolation[]): number {
  if (a.length !== b.length) return a.length - b.length
  const rankA = Math.min(...a.map(violationRank))
  const rankB = Math.min(...b.map(violationRank))
  return rankA - rankB
}

function indexOfMax(sorted: readonly number[]): number {
  let idx = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] > sorted[idx]) idx = i
  }
  return idx
}

function indexOfMin(sorted: readonly number[]): number {
  let idx = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] < sorted[idx]) idx = i
  }
  return idx
}

/** 연속 길이가 target보다 길 때 끊기 좋은 자리(최장 연속 구간 중앙) */
function pickRunRepairIndex(sorted: readonly number[], targetRun: number): number {
  const maxRun = maxConsecutiveRunLength(sorted)
  if (maxRun <= targetRun) {
    return sorted.length - 1
  }
  let bestStart = 0
  let bestLen = 1
  let start = 0
  let len = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      len++
    } else {
      if (len > bestLen) {
        bestLen = len
        bestStart = start
      }
      start = i + 1
      len = 1
    }
  }
  if (len > bestLen) {
    bestLen = len
    bestStart = start
  }
  return bestStart + Math.floor(bestLen / 2)
}

function pickRepairIndex(
  sorted: readonly number[],
  violations: readonly SetViolation[],
  evenT: number,
  runT: number,
  bandTargets: readonly number[],
): number {
  if (violations.includes('band')) {
    for (let i = 0; i < 6; i++) {
      if (numberToBandIndex(sorted[i]) !== bandTargets[i]) return i
    }
  }
  if (violations.includes('sum_high')) return indexOfMax(sorted)
  if (violations.includes('sum_low')) return indexOfMin(sorted)
  if (violations.includes('even')) {
    const evens = sorted.filter((n) => n % 2 === 0).length
    const needMoreEven = evens < evenT
    for (let i = 0; i < 6; i++) {
      const isEven = sorted[i] % 2 === 0
      if (needMoreEven && !isEven) return i
      if (!needMoreEven && isEven) return i
    }
  }
  if (violations.includes('run')) {
    return pickRunRepairIndex(sorted, runT)
  }
  return 0
}

function replaceCandidates(
  sorted: readonly number[],
  position: number,
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  histCounts: readonly number[],
): number[] {
  const band = bandTargets[position]
  const lo = position > 0 ? sorted[position - 1] : 0
  const hi = position < 5 ? sorted[position + 1] : 46
  const current = sorted[position]
  const list = poolByBand.get(band) ?? []
  return list
    .filter((n) => n > lo && n < hi && n !== current)
    .sort((a, b) => {
      const ca = histCounts[a - 1] ?? 0
      const cb = histCounts[b - 1] ?? 0
      if (ca !== cb) return ca - cb
      return a - b
    })
}

/** 자리별 band 목표 구간에서 오름차순 유지하며 랜덤 6개 */
export function randomBandSeed(
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
): number[] | null {
  if (bandTargets.length !== 6) return null
  const sorted: number[] = []
  let prev = 0
  for (let i = 0; i < 6; i++) {
    const band = bandTargets[i]
    const lo = i > 0 ? prev : 0
    const candidates = (poolByBand.get(band) ?? []).filter((n) => n > lo)
    if (candidates.length === 0) return null
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    sorted.push(pick)
    prev = pick
  }
  return sorted
}

/**
 * 규칙 A: 자리 i의 band 목표 구간 안, histCount 낮은 순으로 교체.
 * 위반이 줄거나 ok가 되면 true.
 */
export function repairOneStep(
  sorted: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  histCounts: readonly number[],
): boolean {
  if (before.ok) return false
  const pos = pickRepairIndex(
    sorted,
    before.violations,
    constraints.evenT,
    constraints.runT,
    constraints.bandTargets,
  )
  const candidates = replaceCandidates(
    sorted,
    pos,
    poolByBand,
    constraints.bandTargets,
    histCounts,
  )
  const sumBefore = sorted.reduce((a, b) => a + b, 0)
  const evensBefore = sorted.filter((x) => x % 2 === 0).length
  const runBefore = maxConsecutiveRunLength(sorted)

  for (const n of candidates) {
    const prev = sorted[pos]
    sorted[pos] = n
    const after = validateSet(sorted, constraints)
    const sumAfter = sorted.reduce((a, b) => a + b, 0)
    const evensAfter = sorted.filter((x) => x % 2 === 0).length
    const runAfter = maxConsecutiveRunLength(sorted)
    const bandAtPosOk =
      before.violations.includes('band') &&
      numberToBandIndex(n) === constraints.bandTargets[pos]
    const sumCloser =
      (before.violations.includes('sum_high') && sumAfter < sumBefore) ||
      (before.violations.includes('sum_low') && sumAfter > sumBefore)
    const evenCloser =
      before.violations.includes('even') &&
      Math.abs(evensAfter - constraints.evenT) < Math.abs(evensBefore - constraints.evenT)
    const runCloser =
      before.violations.includes('run') &&
      Math.abs(runAfter - constraints.runT) < Math.abs(runBefore - constraints.runT)
    if (
      after.ok ||
      compareViolationSets(after.violations, before.violations) < 0 ||
      bandAtPosOk ||
      sumCloser ||
      evenCloser ||
      runCloser
    ) {
      return true
    }
    sorted[pos] = prev
  }
  return false
}

export function tryBuildOneSet(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  histCounts: readonly number[],
): number[] | null {
  for (let attempt = 0; attempt < MAX_SEED_ATTEMPTS; attempt++) {
    const sorted = randomBandSeed(poolByBand, constraints.bandTargets)
    if (!sorted) continue
    let state = validateSet(sorted, constraints)
    if (state.ok) return sorted
    for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
      if (!repairOneStep(sorted, state, constraints, poolByBand, histCounts)) break
      state = validateSet(sorted, constraints)
      if (state.ok) return sorted
    }
  }
  return null
}
