import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand'

/** 교체 루프 최대 스텝(시드 1회당) */
export const MAX_REPAIR_STEPS = 300

/** 프로필당 랜덤 시드 재시도 상한(Monte Carlo 전수 아님) */
export const MAX_SEED_ATTEMPTS = 48

/** 추천 조합 생성: 합·홀짝·연속 맞추기 시도 횟수(초과 시 첫 추출 6개 사용) */
export const PROFILE_BUILD_ATTEMPTS = 10

/** 백트래킹·강제 교체 탐색 노드 상한 */
export const MAX_BACKTRACK_NODES = 40_000

/** 백트래킹 시 자리당 시도할 후보 상한(다양성 우선 순) */
const MAX_BACKTRACK_CANDS_PER_POS = 9

const BAND_WIDTH = 5

/** 강제 교체 전체 스캔 상한(프로필당) */
export const MAX_FORCE_REPAIR_STEPS = 4_000

/** 확률적 교체 시도 상한(프로필당) */
export const MAX_STOCHASTIC_REPAIR_STEPS = 1_500

/** BFS 교체 탐색 방문 상한(프로필당) */
export const MAX_BFS_REPAIR_VISITS = 8_000

/** band4 프로필 전용 BFS 방문 상한 */
export const MAX_BFS_REPAIR_VISITS_BAND4 = 22_000

/** 프로필 미생성 원인(요약·진단용) */
export type ProfileFailureReason =
  | 'rank_unavailable'
  | 'no_band_in_pool'
  | 'constraints_unsat'
  | 'duplicate_only'
  | 'ok'

/** 이 크기 이하 채택 풀에서 BFS·전체 백트래킹을 쓴다(통합 채택 풀 규모) */
export const HEAVY_SEARCH_MAX_POOL = 45

export type ForceBuildOptions = {
  allowBacktrack?: boolean
  /** band3·4 프로필은 풀이 커도 BFS·백트래킹을 허용 */
  bandTier?: number
  /** oe 랭크 3 이상: 시드·교체 시도만 줄임(20세트 채우기는 우선순위 순서로) */
  lightOe?: boolean
}

export type SetViolation = 'sum_high' | 'sum_low' | 'even' | 'run' | 'band' | 'duplicate'

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

/** 교체·초기 추출 시 세트 간 다양성(번호·구간 칸 사용 빈도)을 반영한다 */
export type RepairPickCtx = {
  usage?: ReadonlyMap<number, number>
  innerSlotUsage?: ReadonlyMap<string, number>
}

function innerSlotKey(n: number): string {
  const b = numberToBandIndex(n)
  return `${b}:${n - (b * BAND_WIDTH + 1)}`
}

export type RepairStepOptions = {
  /** true면 합 위반은 무시하고 홀짝·연속·band만 맞춘다 */
  ignoreSum?: boolean
}

const DIVERSE_TOP_K = 8

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
export function adoptedPoolSize(poolByBand: ReadonlyMap<number, number[]>): number {
  let total = 0
  for (const list of poolByBand.values()) total += list.length
  return total
}

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

/** 채택 풀 전체 번호(중복 제거·오름차순) */
export function flatAdoptedPool(poolByBand: ReadonlyMap<number, number[]>): number[] {
  const set = new Set<number>()
  for (const list of poolByBand.values()) {
    for (const n of list) set.add(n)
  }
  return [...set].sort((a, b) => a - b)
}

/** 자리별 band 목표 구간에 후보가 하나라도 있는지(6개 중복 없이 뽑기 가능) */
export function canPickBandSkeleton(
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
): boolean {
  if (bandTargets.length !== 6) return false
  const nodes = { count: 0 }
  return (
    backtrackPositionPicks(poolByBand, bandTargets, pickCtx, 0, [], nodes) !== null
  )
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

/** 저장·표시용 오름차순(자리별 추출 후 적용) */
export function sortPickedAsc(nums: readonly number[]): number[] {
  return [...nums].sort((a, b) => a - b)
}

/**
 * 1~6번 구간(자리)별로 뽑은 picked 검증.
 * band는 자리 인덱스 기준, 합·홀짝·연속은 6개를 정렬한 뒤 검사한다.
 */
export function validatePickedSet(
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult {
  const violations: SetViolation[] = []
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] }
  if (new Set(picked).size !== 6) violations.push('duplicate')
  for (let i = 0; i < 6; i++) {
    if (numberToBandIndex(picked[i]!) !== constraints.bandTargets[i]) {
      violations.push('band')
      break
    }
  }
  const sorted = sortPickedAsc(picked)
  const sum = sorted.reduce((a, b) => a + b, 0)
  if (sum > constraints.maxSum) violations.push('sum_high')
  if (sum < constraints.minSum) violations.push('sum_low')
  const evens = sorted.filter((n) => n % 2 === 0).length
  if (evens !== constraints.evenT) violations.push('even')
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run')
  return { ok: violations.length === 0, violations }
}

/** 정렬된 6개에 대한 검증(단위 테스트·레거시). band는 picked와 동일 순서 가정 */
export function validateSet(sorted: readonly number[], constraints: ProfileConstraints): ValidateResult {
  return validatePickedSet(sorted, constraints)
}

/** 합·홀짝·연속만 검사(band·자리 무시). 채택 풀에 자리 band 후보가 없을 때 사용 */
export function validateMetricsOnly(
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult {
  const violations: SetViolation[] = []
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] }
  if (new Set(picked).size !== 6) violations.push('duplicate')
  const sorted = sortPickedAsc(picked)
  const sum = sorted.reduce((a, b) => a + b, 0)
  if (sum > constraints.maxSum) violations.push('sum_high')
  if (sum < constraints.minSum) violations.push('sum_low')
  const evens = sorted.filter((n) => n % 2 === 0).length
  if (evens !== constraints.evenT) violations.push('even')
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run')
  return { ok: violations.length === 0, violations }
}

/** 합·band·중복만 검사(홀짝·연속 포함, 합 제외) */
export function validatePickedNoSum(
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult {
  const violations: SetViolation[] = []
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] }
  if (new Set(picked).size !== 6) violations.push('duplicate')
  for (let i = 0; i < 6; i++) {
    if (numberToBandIndex(picked[i]!) !== constraints.bandTargets[i]) {
      violations.push('band')
      break
    }
  }
  const sorted = sortPickedAsc(picked)
  const evens = sorted.filter((n) => n % 2 === 0).length
  if (evens !== constraints.evenT) violations.push('even')
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run')
  return { ok: violations.length === 0, violations }
}

/** 폴백 2단계: 홀짝·연속 둘 다 일치(합 무시) */
export function hasFallbackBothMetricsOk(
  picked: readonly number[],
  constraints: ProfileConstraints,
): boolean {
  const sorted = sortPickedAsc(picked)
  const evens = sorted.filter((n) => n % 2 === 0).length
  const run = maxConsecutiveRunLength(sorted)
  return evens === constraints.evenT && run === constraints.runT
}

/** 폴백 1단계: 홀짝·연속 중 최소 1개 일치(합 무시) */
export function hasFallbackMetricOk(
  picked: readonly number[],
  constraints: ProfileConstraints,
): boolean {
  const sorted = sortPickedAsc(picked)
  const evens = sorted.filter((n) => n % 2 === 0).length
  const run = maxConsecutiveRunLength(sorted)
  return evens === constraints.evenT || run === constraints.runT
}

/** 낮을수록 덜 쓴 후보(다양성 우선) */
function candidateScore(n: number, ctx: RepairPickCtx): number {
  const used = ctx.usage?.get(n) ?? 0
  const slotUsed = ctx.innerSlotUsage?.get(innerSlotKey(n)) ?? 0
  return used * 12 + slotUsed * 4
}

function orderCandidatesDiverse(list: readonly number[], ctx: RepairPickCtx): number[] {
  const byScore = new Map<number, number[]>()
  for (const n of list) {
    const score = candidateScore(n, ctx)
    const bucket = byScore.get(score) ?? []
    bucket.push(n)
    byScore.set(score, bucket)
  }
  const out: number[] = []
  for (const score of [...byScore.keys()].sort((a, b) => a - b)) {
    out.push(...shuffleNums(byScore.get(score)!))
  }
  return out
}

function shuffleNums(nums: readonly number[]): number[] {
  const out = [...nums]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

function diverseCandidateOrder(list: readonly number[], ctx: RepairPickCtx): number[] {
  const ordered = orderCandidatesDiverse(list, ctx)
  const topK = ordered.slice(0, Math.min(DIVERSE_TOP_K, ordered.length))
  return shuffleNums(topK)
}

function pickDiverseOne(candidates: readonly number[], ctx: RepairPickCtx): number | null {
  if (candidates.length === 0) return null
  const top = orderCandidatesDiverse(candidates, ctx).slice(
    0,
    Math.min(DIVERSE_TOP_K, candidates.length),
  )
  const weights = top.map((n) => 1 / (candidateScore(n, ctx) + 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < top.length; i++) {
    r -= weights[i]!
    if (r <= 0) return top[i]!
  }
  return top[top.length - 1]!
}

/** 합 무시·mode에 따라 홀짝·연속 맞출 때까지 교체 */
function repairFallbackUntil(
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  mode: 'both' | 'one',
): boolean {
  const satisfied = () =>
    mode === 'both'
      ? hasFallbackBothMetricsOk(picked, constraints)
      : hasFallbackMetricOk(picked, constraints)

  if (satisfied()) return true

  for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
    if (satisfied()) return true
    const state = validatePickedNoSum(picked, constraints)
    if (!repairOneStep(picked, state, constraints, poolByBand, pickCtx, { ignoreSum: true })) break
  }
  return satisfied()
}

function violationRank(v: SetViolation): number {
  if (v === 'duplicate' || v === 'band') return 0
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

function violationScore(violations: readonly SetViolation[]): number {
  let score = violations.length * 10
  for (const v of violations) {
    score += 4 - violationRank(v)
  }
  return score
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

function pickRepairSortedIndex(
  sorted: readonly number[],
  violations: readonly SetViolation[],
  evenT: number,
  runT: number,
): number {
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

/** 홀짝·연속·합 교체 시 정렬 슬롯 → 자리(구간) 인덱스 */
function pickRepairPosition(
  picked: readonly number[],
  violations: readonly SetViolation[],
  evenT: number,
  runT: number,
  bandTargets: readonly number[],
): number {
  if (violations.includes('band')) {
    for (let i = 0; i < 6; i++) {
      if (numberToBandIndex(picked[i]!) !== bandTargets[i]) return i
    }
  }
  const metricViolations = violations.filter((v) => v !== 'band' && v !== 'duplicate')
  if (metricViolations.length === 0) return 0
  const sorted = sortPickedAsc(picked)
  const si = pickRepairSortedIndex(sorted, metricViolations, evenT, runT)
  const value = sorted[si]!
  const pi = picked.indexOf(value)
  return pi >= 0 ? pi : 0
}

/** 같은 자리 band 안 교체 후보 — 덜 쓴 번호·칸 우선, 상위 K개는 무작위 순 */
function replaceCandidatesForPosition(
  picked: readonly number[],
  position: number,
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
): number[] {
  const band = bandTargets[position]
  const current = picked[position]
  const list = poolByBand.get(band) ?? []
  const used = new Set(picked)
  return diverseCandidateOrder(
    list.filter((n) => n !== current && !used.has(n)),
    pickCtx,
  )
}

/** 1~6번 구간마다 band 목표 구간에서 번호 1개씩(크기 순 없음) */
function backtrackPositionPicks(
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
  pos: number,
  picked: number[],
  nodes: { count: number },
): number[] | null {
  if (nodes.count >= MAX_BACKTRACK_NODES) return null
  nodes.count++

  if (pos === 6) return [...picked]

  const band = bandTargets[pos]
  const used = new Set(picked)
  const candidates = diverseCandidateOrder(
    (poolByBand.get(band) ?? []).filter((n) => !used.has(n)),
    pickCtx,
  ).slice(0, MAX_BACKTRACK_CANDS_PER_POS)
  if (candidates.length === 0) return null

  for (const n of candidates) {
    picked.push(n)
    const found = backtrackPositionPicks(poolByBand, bandTargets, pickCtx, pos + 1, picked, nodes)
    if (found) return found
    picked.pop()
  }
  return null
}

function backtrackBuildOneSet(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
  pos: number,
  picked: number[],
  nodes: { count: number },
): number[] | null {
  if (nodes.count >= MAX_BACKTRACK_NODES) return null
  nodes.count++

  if (pos === 6) {
    const state = validatePickedSet(picked, constraints)
    return state.ok ? sortPickedAsc(picked) : null
  }

  const band = constraints.bandTargets[pos]
  const used = new Set(picked)
  const candidates = diverseCandidateOrder(
    (poolByBand.get(band) ?? []).filter((n) => !used.has(n)),
    pickCtx,
  ).slice(0, MAX_BACKTRACK_CANDS_PER_POS)
  if (candidates.length === 0) return null

  for (const n of candidates) {
    picked.push(n)
    const found = backtrackBuildOneSet(poolByBand, constraints, pickCtx, pos + 1, picked, nodes)
    if (found) return found
    picked.pop()
  }
  return null
}

/** 위반이 남아도 한 자리(구간)라도 교체해 탐색을 이어간다 */
function aggressiveRepairUntilOk(
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
): boolean {
  let state = validatePickedSet(picked, constraints)
  if (state.ok) return true

  for (let step = 0; step < MAX_FORCE_REPAIR_STEPS; step++) {
    if (state.ok) return true
    let progressed = false
    for (let pos = 0; pos < 6; pos++) {
      const candidates = replaceCandidatesForPosition(
        picked,
        pos,
        poolByBand,
        constraints.bandTargets,
        pickCtx,
      )
      for (const n of candidates) {
        const prev = picked[pos]
        picked[pos] = n
        const next = validatePickedSet(picked, constraints)
        if (
          next.ok ||
          compareViolationSets(next.violations, state.violations) <= 0
        ) {
          state = next
          progressed = true
          if (state.ok) return true
          break
        }
        picked[pos] = prev
      }
    }
    if (!progressed && repairOneStep(picked, state, constraints, poolByBand, pickCtx)) {
      state = validatePickedSet(picked, constraints)
      progressed = true
      if (state.ok) return true
    }
    if (!progressed) break
  }
  return validatePickedSet(picked, constraints).ok
}

function bfsRepairUntilOk(
  startPicked: readonly number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  maxVisits: number = MAX_BFS_REPAIR_VISITS,
): number[] | null {
  const startKey = startPicked.join(',')
  const queue: number[][] = [[...startPicked]]
  const seen = new Set<string>([startKey])

  while (queue.length > 0 && seen.size < maxVisits) {
    const cur = queue.shift()!
    const state = validatePickedSet(cur, constraints)
    if (state.ok) return sortPickedAsc(cur)

    for (let pos = 0; pos < 6; pos++) {
      const candidates = replaceCandidatesForPosition(
        cur,
        pos,
        poolByBand,
        constraints.bandTargets,
        pickCtx,
      )
      for (const n of candidates) {
        const next = [...cur]
        next[pos] = n
        const key = next.join(',')
        if (seen.has(key)) continue
        seen.add(key)
        queue.push(next)
      }
    }
  }
  return null
}

function stochasticRepairUntilOk(
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
): boolean {
  let state = validatePickedSet(picked, constraints)
  if (state.ok) return true

  let bestScore = violationScore(state.violations)
  const best = [...picked]

  for (let step = 0; step < MAX_STOCHASTIC_REPAIR_STEPS; step++) {
    state = validatePickedSet(picked, constraints)
    if (state.ok) return true

    const pos = step % 6
    const candidates = replaceCandidatesForPosition(
      picked,
      pos,
      poolByBand,
      constraints.bandTargets,
      pickCtx,
    )
    if (candidates.length === 0) continue

    const pick = pickDiverseOne(candidates, pickCtx) ?? candidates[0]!
    const prev = picked[pos]
    picked[pos] = pick
    const next = validatePickedSet(picked, constraints)
    const nextScore = violationScore(next.violations)

    if (next.ok) return true

    if (nextScore <= bestScore || Math.random() < 0.12) {
      bestScore = nextScore
      best.splice(0, 6, ...picked)
      state = next
    } else {
      picked[pos] = prev
    }
  }

  picked.splice(0, 6, ...best)
  return validatePickedSet(picked, constraints).ok
}

function pickSixFromFlatPool(flat: readonly number[], pickCtx: RepairPickCtx): number[] | null {
  if (flat.length < 6) return null
  const used = new Set<number>()
  const picked: number[] = []
  for (let i = 0; i < 6; i++) {
    const candidates = flat.filter((n) => !used.has(n))
    if (candidates.length === 0) return null
    const pick = pickDiverseOne(candidates, pickCtx) ?? candidates[0]!
    picked.push(pick)
    used.add(pick)
  }
  return picked
}

function replaceCandidatesFromFullPool(
  picked: readonly number[],
  position: number,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): number[] {
  const current = picked[position]
  const used = new Set(picked)
  return diverseCandidateOrder(
    flatPool.filter((n) => n !== current && !used.has(n)),
    pickCtx,
  )
}

function repairMetricsOneStep(
  picked: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): boolean {
  if (before.ok) return false
  const pos = pickRepairPosition(
    picked,
    before.violations,
    constraints.evenT,
    constraints.runT,
    constraints.bandTargets,
  )
  const candidates = replaceCandidatesFromFullPool(picked, pos, flatPool, pickCtx)
  const sortedBefore = sortPickedAsc(picked)
  const sumBefore = sortedBefore.reduce((a, b) => a + b, 0)
  const evensBefore = sortedBefore.filter((x) => x % 2 === 0).length
  const runBefore = maxConsecutiveRunLength(sortedBefore)

  for (const n of candidates) {
    const prev = picked[pos]
    picked[pos] = n
    const after = validateMetricsOnly(picked, constraints)
    const sortedAfter = sortPickedAsc(picked)
    const sumAfter = sortedAfter.reduce((a, b) => a + b, 0)
    const evensAfter = sortedAfter.filter((x) => x % 2 === 0).length
    const runAfter = maxConsecutiveRunLength(sortedAfter)
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
      sumCloser ||
      evenCloser ||
      runCloser
    ) {
      return true
    }
    picked[pos] = prev
  }
  return false
}

function repairUntilMetricsOk(
  picked: number[],
  constraints: ProfileConstraints,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): boolean {
  if (validateMetricsOnly(picked, constraints).ok) return true
  for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
    if (validateMetricsOnly(picked, constraints).ok) return true
    const state = validateMetricsOnly(picked, constraints)
    if (!repairMetricsOneStep(picked, state, constraints, flatPool, pickCtx)) break
  }
  return validateMetricsOnly(picked, constraints).ok
}

/**
 * 자리 band를 맞출 수 없을 때 채택 풀에서 6개를 뽑아 합·홀짝·연속만 맞춘다.
 */
export function buildMetricsOnlyFromPool(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
  maxAttempts: number = PROFILE_BUILD_ATTEMPTS,
): number[] | null {
  const flat = flatAdoptedPool(poolByBand)
  if (flat.length < 6) return null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const picked = pickSixFromFlatPool(flat, pickCtx)
    if (!picked) continue
    const work = [...picked]
    if (repairUntilMetricsOk(work, constraints, flat, pickCtx)) {
      return sortPickedAsc(work)
    }
  }
  return null
}

/** 1~6번 구간마다 band 목표에서 각각 1개(다양성 가중 무작위) */
export function randomPerPositionPick(
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx = {},
): number[] | null {
  if (bandTargets.length !== 6) return null
  const ctx = pickCtx
  const flat = flatAdoptedPool(poolByBand)
  if (flat.length < 6) return null
  const picked: number[] = []
  const used = new Set<number>()
  for (let i = 0; i < 6; i++) {
    const band = bandTargets[i]
    let candidates = (poolByBand.get(band) ?? []).filter((n) => !used.has(n))
    if (candidates.length === 0) {
      candidates = flat.filter((n) => !used.has(n))
    }
    if (candidates.length === 0) return null
    const pick = pickDiverseOne(candidates, ctx) ?? candidates[0]!
    picked.push(pick)
    used.add(pick)
  }
  return picked
}

/** @deprecated randomPerPositionPick 사용 */
export function randomBandSeed(
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
): number[] | null {
  return randomPerPositionPick(poolByBand, bandTargets)
}

/**
 * 자리 i의 band 안에서 후보를 섞어 교체. 위반이 줄거나 ok면 true.
 */
export function repairOneStep(
  picked: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  options?: RepairStepOptions,
): boolean {
  if (before.ok) return false
  const ignoreSum = options?.ignoreSum === true
  const pos = pickRepairPosition(
    picked,
    before.violations,
    constraints.evenT,
    constraints.runT,
    constraints.bandTargets,
  )
  const candidates = replaceCandidatesForPosition(
    picked,
    pos,
    poolByBand,
    constraints.bandTargets,
    pickCtx,
  )
  const sortedBefore = sortPickedAsc(picked)
  const sumBefore = sortedBefore.reduce((a, b) => a + b, 0)
  const evensBefore = sortedBefore.filter((x) => x % 2 === 0).length
  const runBefore = maxConsecutiveRunLength(sortedBefore)

  for (const n of candidates) {
    const prev = picked[pos]
    picked[pos] = n
    const after = ignoreSum
      ? validatePickedNoSum(picked, constraints)
      : validatePickedSet(picked, constraints)
    const sortedAfter = sortPickedAsc(picked)
    const sumAfter = sortedAfter.reduce((a, b) => a + b, 0)
    const evensAfter = sortedAfter.filter((x) => x % 2 === 0).length
    const runAfter = maxConsecutiveRunLength(sortedAfter)
    const bandAtPosOk =
      before.violations.includes('band') &&
      numberToBandIndex(n) === constraints.bandTargets[pos]
    const sumCloser =
      !ignoreSum &&
      ((before.violations.includes('sum_high') && sumAfter < sumBefore) ||
        (before.violations.includes('sum_low') && sumAfter > sumBefore))
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
    picked[pos] = prev
  }
  return false
}

export function tryBuildOneSet(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
): number[] | null {
  for (let attempt = 0; attempt < MAX_SEED_ATTEMPTS; attempt++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx)
    if (!picked) continue
    const work = [...picked]
    let state = validatePickedSet(work, constraints)
    if (state.ok) return sortPickedAsc(work)
    for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
      if (!repairOneStep(work, state, constraints, poolByBand, pickCtx)) break
      state = validatePickedSet(work, constraints)
      if (state.ok) return sortPickedAsc(work)
    }
  }
  return null
}

function tryFallbackFromBases(
  bases: readonly (readonly number[])[],
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
): number[] | null {
  for (const base of bases) {
    const work = [...base]
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'both')) {
      return sortPickedAsc(work)
    }
  }
  for (const base of bases) {
    const work = [...base]
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'one')) {
      return sortPickedAsc(work)
    }
  }
  return null
}

/**
 * PROFILE_BUILD_ATTEMPTS회만 합·홀짝·연속 맞추기를 시도한다.
 * 실패 시 폴백: ① 합 제외·홀짝·연속 둘 다 ② 그래도 안 되면 둘 중 1개 이상.
 */
export function buildOneSetWithFallback(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx = {},
  maxAttempts: number = PROFILE_BUILD_ATTEMPTS,
): { sorted: number[]; usedFallback: boolean } | null {

  if (!canPickBandSkeleton(poolByBand, constraints.bandTargets, pickCtx)) {
    const metricsOnly = buildMetricsOnlyFromPool(
      poolByBand,
      constraints,
      pickCtx,
      maxAttempts * 2,
    )
    if (metricsOnly) return { sorted: metricsOnly, usedFallback: true }
  }

  let firstDraw: number[] | null = null
  const attemptDraws: number[][] = []

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx)
    if (!picked) continue
    if (!firstDraw) firstDraw = [...picked]
    attemptDraws.push([...picked])

    const work = [...picked]
    let state = validatePickedSet(work, constraints)
    if (!state.ok) {
      for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
        if (!repairOneStep(work, state, constraints, poolByBand, pickCtx)) break
        state = validatePickedSet(work, constraints)
        if (state.ok) break
      }
    }
    if (state.ok) {
      return { sorted: sortPickedAsc(work), usedFallback: false }
    }
  }

  const fallbackBases = firstDraw ? [[...firstDraw], ...attemptDraws] : attemptDraws
  const fromBases = tryFallbackFromBases(fallbackBases, poolByBand, constraints, pickCtx)
  if (fromBases) return { sorted: fromBases, usedFallback: true }

  for (let extra = 0; extra < maxAttempts; extra++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx)
    if (!picked) continue
    const work = [...picked]
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'both')) {
      return { sorted: sortPickedAsc(work), usedFallback: true }
    }
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'one')) {
      return { sorted: sortPickedAsc(work), usedFallback: true }
    }
  }

  const metricsOnly = buildMetricsOnlyFromPool(
    poolByBand,
    constraints,
    pickCtx,
    maxAttempts * 2,
  )
  if (metricsOnly) return { sorted: metricsOnly, usedFallback: true }

  return null
}

/**
 * 랜덤 시드·교체 실패 시 백트래킹·강제 교체로 합·홀짝·연속·자리 band를 맞춘다.
 * 채택 풀에 해가 없으면 null.
 */
export function forceBuildOneSet(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx = {},
  options?: ForceBuildOptions,
): number[] | null {
  const allowBacktrack = options?.allowBacktrack !== false
  const bandTier = options?.bandTier ?? 0
  const lightOe = options?.lightOe === true
  const isBand4 = bandTier === 4
  const heavySearch =
    adoptedPoolSize(poolByBand) <= HEAVY_SEARCH_MAX_POOL || bandTier >= 3

  const quick = tryBuildOneSet(poolByBand, constraints, pickCtx)
  if (quick) return quick

  const seedAttempts = heavySearch
    ? isBand4
      ? MAX_SEED_ATTEMPTS
      : lightOe
        ? 16
        : MAX_SEED_ATTEMPTS
    : lightOe
      ? 10
      : 20
  for (let attempt = 0; attempt < seedAttempts; attempt++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx)
    if (!picked) continue
    const work = [...picked]
    if (aggressiveRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work)
    }
    if (heavySearch && stochasticRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work)
    }
  }

  if (!allowBacktrack || !heavySearch) return null

  const bfsCap = isBand4 ? MAX_BFS_REPAIR_VISITS_BAND4 : MAX_BFS_REPAIR_VISITS

  const nodesBand = { count: 0 }
  const bandSkeleton = backtrackPositionPicks(
    poolByBand,
    constraints.bandTargets,
    pickCtx,
    0,
    [],
    nodesBand,
  )
  if (bandSkeleton) {
    const work = [...bandSkeleton]
    if (aggressiveRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work)
    }
    const bfs = bfsRepairUntilOk(work, constraints, poolByBand, pickCtx, bfsCap)
    if (bfs) return bfs
    if (stochasticRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work)
    }
  }

  const seed = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx)
  if (seed) {
    const bfs = bfsRepairUntilOk(seed, constraints, poolByBand, pickCtx, bfsCap)
    if (bfs) return bfs
  }

  const nodesFull = { count: 0 }
  const full = backtrackBuildOneSet(poolByBand, constraints, pickCtx, 0, [], nodesFull)
  if (full) return full

  return null
}

function setKeyFromSorted(sorted: readonly number[]): string {
  return [...sorted].join(',')
}

/** 채택 풀·제약 기준으로 프로필이 왜 비었는지 구분(usedKeys는 중복만 검사) */
export function diagnoseProfileBuild(
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  usedKeys: ReadonlySet<string>,
  pickCtx: RepairPickCtx = {},
  options?: ForceBuildOptions,
): ProfileFailureReason {
  if (!canPickBandSkeleton(poolByBand, constraints.bandTargets, pickCtx)) {
    const metrics = buildMetricsOnlyFromPool(
      poolByBand,
      constraints,
      pickCtx,
      PROFILE_BUILD_ATTEMPTS,
    )
    if (!metrics) return 'no_band_in_pool'
    if (usedKeys.has(setKeyFromSorted(metrics))) return 'duplicate_only'
    return 'ok'
  }

  const built = forceBuildOneSet(poolByBand, constraints, pickCtx, options)
  if (!built) return 'constraints_unsat'
  if (usedKeys.has(setKeyFromSorted(built))) return 'duplicate_only'
  return 'ok'
}
