import { GeneratedSet, TrendNumberResult } from '@/app/recommend/logic/types'

/**
 * 추세 국면별 가산점.
 * 회복 국면 번호를 우선 선택하되, 커버리지 점수가 더 높은 후보가 있으면 그쪽을 선택한다.
 */
const TREND_BONUS: Record<string, number> = {
  recovering: 2,
  up_cont: 1,
  topping: 0,
  down_cont: -1,
}

function mkPairKey(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`
}

function mkTripleKey(a: number, b: number, c: number): string {
  const [x, y, z] = [a, b, c].sort((i, j) => i - j)
  return `${x},${y},${z}`
}

/**
 * 결정론적 탐욕 트리플 커버리지 알고리즘.
 *
 * 동작 방식:
 *   1. 세트 s마다 "강제 시작 번호"를 전체 풀에 고르게 분산시켜 첫 번호를 고정한다.
 *   2. 나머지 5개는 탐욕 점수(신규 트리플 × 10 + 신규 페어 × 2 + 추세 보너스 - 사용 횟수 패널티)가
 *      가장 높은 번호를 순서대로 선택한다. 동점이면 작은 번호를 선택한다.
 *   3. 이미 생성된 세트와 동일한 조합이면 건너뛰고 다음 강제 시작 인덱스를 시도한다.
 *
 * 보장:
 *   - 동일한 available + trendResults 입력 → 항상 동일한 결과 (Math.random 사용 없음)
 *   - 전체 풀에 걸쳐 번호가 고르게 분포
 *   - 트리플 커버리지 극대화로 3개 일치(4등) 이상의 기대 적중 횟수 최대화
 */
export function generateDeterministicSets(
  available: number[],
  trendResults: TrendNumberResult[],
  count: number = 20,
): GeneratedSet[] {
  if (available.length < 6) return []

  const sorted = [...available].sort((a, b) => a - b)
  const N = sorted.length

  const trendMap = new Map<number, string>(trendResults.map((t) => [t.number, t.trend]))
  const usageCount = new Map<number, number>(sorted.map((n) => [n, 0]))
  const coveredTriples = new Set<string>()
  const coveredPairs = new Set<string>()
  const usedSetKeys = new Set<string>()
  const sets: GeneratedSet[] = []

  /**
   * 강제 시작 인덱스 간격: count개의 시작점이 [0, N) 전체에 고루 분산되도록 한다.
   * 예) N=40, count=20 → step=2 → 인덱스 0,2,4,...,38
   */
  const startStep = Math.max(1, Math.round(N / count))

  for (let attempt = 0; sets.length < count && attempt < count * 3; attempt++) {
    const forcedIdx = (attempt * startStep) % N
    const forcedNum = sorted[forcedIdx]
    const selected: number[] = [forcedNum]

    for (let k = 1; k < 6; k++) {
      let bestNum = -1
      let bestScore = -Infinity

      for (const num of sorted) {
        if (selected.includes(num)) continue

        let newTriples = 0
        let newPairs = 0

        for (let i = 0; i < selected.length; i++) {
          const s1 = selected[i]
          if (!coveredPairs.has(mkPairKey(num, s1))) newPairs++

          for (let j = i + 1; j < selected.length; j++) {
            const s2 = selected[j]
            if (!coveredTriples.has(mkTripleKey(num, s1, s2))) newTriples++
          }
        }

        const tBonus = TREND_BONUS[trendMap.get(num) ?? 'topping'] ?? 0
        const fPenalty = (usageCount.get(num) ?? 0) * 3
        const score = newTriples * 10 + newPairs * 2 + tBonus - fPenalty

        if (score > bestScore || (score === bestScore && (bestNum === -1 || num < bestNum))) {
          bestScore = score
          bestNum = num
        }
      }

      if (bestNum !== -1) selected.push(bestNum)
    }

    if (selected.length < 6) continue

    const sortedSet = selected.sort((a, b) => a - b)
    const key = sortedSet.join(',')
    if (usedSetKeys.has(key)) continue

    usedSetKeys.add(key)
    sets.push({
      num1: sortedSet[0],
      num2: sortedSet[1],
      num3: sortedSet[2],
      num4: sortedSet[3],
      num5: sortedSet[4],
      num6: sortedSet[5],
      method: 'JL Wheel Method',
      strategy: 'deterministic',
    })

    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        coveredPairs.add(mkPairKey(sortedSet[i], sortedSet[j]))
        for (let l = j + 1; l < 6; l++) {
          coveredTriples.add(mkTripleKey(sortedSet[i], sortedSet[j], sortedSet[l]))
        }
      }
    }

    for (const n of sortedSet) {
      usageCount.set(n, (usageCount.get(n) ?? 0) + 1)
    }
  }

  return sets
}

export function generate20Sets(
  available: number[],
  trendResults: TrendNumberResult[],
): GeneratedSet[] {
  return generateDeterministicSets(available, trendResults, 20)
}
