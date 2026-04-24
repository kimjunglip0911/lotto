import { GeneratedSet, TrendNumberResult } from '@/app/recommend/logic/types'

const TREND_WEIGHTS: Record<string, number> = {
  recovering: 3.0,
  up_cont: 2.0,
  topping: 1.0,
  down_cont: 0.5,
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function toKey(nums: number[]): string {
  return [...nums].sort((a, b) => a - b).join(',')
}

function countConsecutive(sorted: number[]): number {
  let count = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) count++
  }
  return count
}

/**
 * Strategy A — Coverage Round-Robin
 * 사용 가능 번호 전체를 최대한 고르게 포함하도록 순환 분배한다.
 */
export function generateCoverageRoundRobin(available: number[], count: number): GeneratedSet[] {
  if (available.length < 6) return []
  const sets: GeneratedSet[] = []
  const usedKeys = new Set<string>()

  const shuffled = shuffleArray(available)
  const len = shuffled.length
  let offset = 0

  while (sets.length < count) {
    const picked: number[] = []
    for (let i = 0; i < 6; i++) {
      picked.push(shuffled[(offset + i) % len])
    }
    offset = (offset + 6) % len

    const sorted = [...picked].sort((a, b) => a - b)
    const key = toKey(sorted)
    if (!usedKeys.has(key)) {
      usedKeys.add(key)
      sets.push(makeSet(sorted, 'coverage'))
    }

    // 무한 루프 방지: 풀이 작아 고유 세트 생성 불가 시 중단
    if (offset === 0 && sets.length < count) break
  }

  return sets
}

/**
 * Strategy B — Statistical Property Match
 * 역대 당첨 패턴(합계, 홀짝, 연속, 구간 분포)을 만족하는 세트를 생성한다.
 */
export function generateStatMatchSets(available: number[], count: number): GeneratedSet[] {
  if (available.length < 6) return []
  const sets: GeneratedSet[] = []
  const usedKeys = new Set<string>()

  const lowPool = available.filter((n) => n >= 1 && n <= 15)
  const midPool = available.filter((n) => n >= 16 && n <= 30)
  const highPool = available.filter((n) => n >= 31 && n <= 45)

  const maxAttempts = 1500
  let attempts = 0

  while (sets.length < count && attempts < maxAttempts) {
    attempts++
    const sorted = sampleWithoutReplacement(available, 6).sort((a, b) => a - b)

    const sum = sorted.reduce((acc, n) => acc + n, 0)
    if (sum < 100 || sum > 200) continue

    const oddCount = sorted.filter((n) => n % 2 === 1).length
    if (oddCount < 2 || oddCount > 4) continue

    if (countConsecutive(sorted) > 2) continue

    const hasLow = lowPool.length === 0 || sorted.some((n) => n >= 1 && n <= 15)
    const hasMid = midPool.length === 0 || sorted.some((n) => n >= 16 && n <= 30)
    const hasHigh = highPool.length === 0 || sorted.some((n) => n >= 31 && n <= 45)
    if (!hasLow || !hasMid || !hasHigh) continue

    const key = toKey(sorted)
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    sets.push(makeSet(sorted, 'stat-match'))
  }

  return sets
}

/**
 * Strategy C — Trend-Weighted Sampling
 * 추세 데이터 기반 가중치를 적용해 회복 국면 번호를 우선 선택한다.
 */
export function generateTrendWeightedSets(
  available: number[],
  trendResults: TrendNumberResult[],
  count: number,
): GeneratedSet[] {
  if (available.length < 6) return []

  const trendMap = new Map<number, string>(trendResults.map((t) => [t.number, t.trend]))
  const weights = available.map((n) => TREND_WEIGHTS[trendMap.get(n) ?? 'topping'] ?? 1.0)

  const sets: GeneratedSet[] = []
  const usedKeys = new Set<string>()
  const maxAttempts = 1000
  let attempts = 0

  while (sets.length < count && attempts < maxAttempts) {
    attempts++
    const sorted = weightedSampleWithoutReplacement(available, weights, 6).sort((a, b) => a - b)
    const key = toKey(sorted)
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    sets.push(makeSet(sorted, 'trend-weighted'))
  }

  return sets
}

/**
 * 세 전략을 혼합해 20세트를 생성한다.
 * Strategy A: 7, Strategy B: 7, Strategy C: 6
 * Strategy B 수렴 실패 시 Strategy A로 보충한다.
 */
export function generate20Sets(
  available: number[],
  trendResults: TrendNumberResult[],
): GeneratedSet[] {
  if (available.length < 6) return []

  const coverageSets = generateCoverageRoundRobin(available, 7)
  const statSets = generateStatMatchSets(available, 7)
  const trendSets = generateTrendWeightedSets(available, trendResults, 6)

  const combined: GeneratedSet[] = [...coverageSets, ...statSets, ...trendSets]

  // 중복 제거 후 부족분 보충
  const usedKeys = new Set(combined.map((s) => toKey([s.num1, s.num2, s.num3, s.num4, s.num5, s.num6])))
  let result = deduplicateSets(combined)

  if (result.length < 20) {
    const fallback = generateCoverageRoundRobin(available, 20 - result.length + 5)
    for (const s of fallback) {
      if (result.length >= 20) break
      const key = toKey([s.num1, s.num2, s.num3, s.num4, s.num5, s.num6])
      if (!usedKeys.has(key)) {
        usedKeys.add(key)
        result.push(s)
      }
    }
  }

  return result.slice(0, 20)
}

// ─── 내부 유틸 ────────────────────────────────────────────────────────────────

function makeSet(sorted: number[], strategy: string): GeneratedSet {
  return {
    num1: sorted[0],
    num2: sorted[1],
    num3: sorted[2],
    num4: sorted[3],
    num5: sorted[4],
    num6: sorted[5],
    method: 'JL Wheel Method',
    strategy,
  }
}

function sampleWithoutReplacement(pool: number[], k: number): number[] {
  const copy = shuffleArray(pool)
  return copy.slice(0, k)
}

function weightedSampleWithoutReplacement(pool: number[], weights: number[], k: number): number[] {
  const indices = Array.from({ length: pool.length }, (_, i) => i)
  const selected: number[] = []
  const remaining = [...indices]
  const remainingWeights = [...weights]

  for (let i = 0; i < k && remaining.length > 0; i++) {
    const total = remainingWeights.reduce((acc, w) => acc + w, 0)
    let rand = Math.random() * total
    let chosen = remaining.length - 1
    for (let j = 0; j < remaining.length; j++) {
      rand -= remainingWeights[j]
      if (rand <= 0) {
        chosen = j
        break
      }
    }
    selected.push(pool[remaining[chosen]])
    remaining.splice(chosen, 1)
    remainingWeights.splice(chosen, 1)
  }

  return selected
}

function deduplicateSets(sets: GeneratedSet[]): GeneratedSet[] {
  const seen = new Set<string>()
  return sets.filter((s) => {
    const key = toKey([s.num1, s.num2, s.num3, s.num4, s.num5, s.num6])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
