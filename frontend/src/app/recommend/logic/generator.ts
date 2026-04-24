import { ChiSquareHistoryRow, GeneratedSet, TrendNumberResult } from '@/app/recommend/logic/types'

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

/**
 * 핫 풀 필터 기준.
 * - MIN_STREAK: 최근 N회 이상 미출현한 번호만 포함 (너무 자주 나온 번호 제외)
 * - MIN_FREQ52: 최근 52회 내 출현 횟수가 이 값 이상인 번호만 포함 (통계적으로 무의미한 번호 제외)
 * - MIN_POOL_SIZE: 핫 풀 크기가 이 값 미만이면 필터를 적용하지 않고 전체 풀 사용
 */
const HOT_POOL_MIN_STREAK = 3
const HOT_POOL_MIN_FREQ52 = 7
const HOT_POOL_MIN_SIZE   = 12

type HistoryRow = Pick<ChiSquareHistoryRow, 'draw_no' | 'num1' | 'num2' | 'num3' | 'num4' | 'num5' | 'num6' | 'bonus_num'>

/**
 * 사용 가능 번호 풀에 핫 풀 필터를 적용한다.
 * streak >= MIN_STREAK AND freq52 >= MIN_FREQ52 조건을 만족하는 번호만 남긴다.
 * 결과가 MIN_POOL_SIZE 미만이면 원래 풀을 그대로 반환한다.
 */
export function applyHotPoolFilter(
  available: number[],
  allHistoryRows: HistoryRow[],
  drawNo: number,
): number[] {
  if (allHistoryRows.length === 0) return available

  const allNums = (r: HistoryRow) => [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.bonus_num]

  // 미출현 기간 계산
  const lastSeen = new Map<number, number>()
  for (const r of allHistoryRows) {
    for (const n of allNums(r)) {
      if (n >= 1 && n <= 45) {
        const prev = lastSeen.get(n) ?? 0
        if (r.draw_no > prev) lastSeen.set(n, r.draw_no)
      }
    }
  }
  const streak = (n: number) => drawNo - (lastSeen.get(n) ?? 0)

  // 최근 52회 출현 빈도
  const recent52 = allHistoryRows.slice(-52)
  const freq52Map = new Map<number, number>()
  for (const r of recent52) {
    for (const n of allNums(r)) {
      if (n >= 1 && n <= 45) freq52Map.set(n, (freq52Map.get(n) ?? 0) + 1)
    }
  }
  const freq52 = (n: number) => freq52Map.get(n) ?? 0

  const hotPool = available.filter(
    (n) => streak(n) >= HOT_POOL_MIN_STREAK && freq52(n) >= HOT_POOL_MIN_FREQ52,
  )

  return hotPool.length >= HOT_POOL_MIN_SIZE ? hotPool : available
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

// ─── 위치별 빈도 다양성 알고리즘 ─────────────────────────────────────────────

/**
 * 과거 데이터에서 위치별(num1~num6) 번호 출현 빈도 행렬을 계산한다.
 * posFreq[slot].get(num) = num이 slot 위치에 나타난 횟수
 */
function computePositionFrequency(rows: HistoryRow[]): Map<number, number>[] {
  const posFreq: Map<number, number>[] = Array.from({ length: 6 }, () => new Map())
  for (const r of rows) {
    const nums = [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6].sort((a, b) => a - b)
    nums.forEach((n, pos) => posFreq[pos].set(n, (posFreq[pos].get(n) ?? 0) + 1))
  }
  return posFreq
}

/**
 * 값 범위 6등분 버킷 + 위치 빈도 정렬 + 3진법 조합으로 20세트를 생성한다.
 *
 * 알고리즘:
 *   1. 핫 풀을 값 크기 기준으로 6개 버킷에 고르게 분배
 *      → 버킷 0은 가장 작은 번호들(num1 후보), 버킷 5는 가장 큰 번호들(num6 후보)
 *   2. 각 버킷을 "해당 위치에서의 과거 출현 횟수" 오름차순 정렬(저빈도 번호 우선)
 *   3. 20세트 조합 = 3진법 독립 3자리(d0, d1, d2)에서 파생한 6자리 조합
 *      picks = [d0, d1, d2, (d0+d1)%3, (d1+d2)%3, (d0+d2)%3]
 *      → 20세트가 모두 다르고, 각 버킷의 모든 번호가 균등 사용
 *
 * 효과:
 *   - 모든 세트가 저구간~고구간을 균형 있게 포함 → 범위 다양성
 *   - 위치별 저빈도 번호 우선 선택 → 위치 특이성 반영
 *   - 핫 풀 번호 전체를 고르게 활용 → 중복 최소화
 *
 * 20세트 미달 시 탐욕 알고리즘으로 부족분 보충.
 */
export function generatePositionDiverseSets(
  pool: number[],
  allHistoryRows: HistoryRow[],
  trendResults: TrendNumberResult[],
  count: number = 20,
): GeneratedSet[] {
  const posFreq = computePositionFrequency(allHistoryRows)
  const sorted = [...pool].sort((a, b) => a - b)
  const N = sorted.length

  if (N < 6) return generateDeterministicSets(pool, trendResults, count)

  // 6 버킷으로 값 범위 분할 (크기 순 등분)
  const baseSize = Math.floor(N / 6)
  const remainder = N % 6
  const sortedBuckets: number[][] = []
  let idx = 0
  for (let g = 0; g < 6; g++) {
    const size = baseSize + (g < remainder ? 1 : 0)
    const bucket = sorted.slice(idx, idx + size)
    // 위치 g에서의 과거 빈도 오름차순 정렬 (저빈도 우선)
    bucket.sort((a, b) => {
      const fa = posFreq[g].get(a) ?? 0
      const fb = posFreq[g].get(b) ?? 0
      return fa !== fb ? fa - fb : a - b
    })
    sortedBuckets.push(bucket)
    idx += size
  }

  const sets: GeneratedSet[] = []
  const usedKeys = new Set<string>()

  // 3진법 독립 3자리(d0, d1, d2)에서 파생한 6자리 조합으로 20세트 생성
  for (let i = 0; i < count * 3 && sets.length < count; i++) {
    const d0 = i % 3
    const d1 = Math.floor(i / 3) % 3
    const d2 = Math.floor(i / 9) % 3
    const rawPicks = [d0, d1, d2, (d0 + d1) % 3, (d1 + d2) % 3, (d0 + d2) % 3]
    const picks = rawPicks.map((p, g) => p % sortedBuckets[g].length)

    const combo = sortedBuckets.map((bucket, g) => bucket[picks[g]]).sort((a, b) => a - b)
    const key = combo.join(',')
    if (!usedKeys.has(key)) {
      usedKeys.add(key)
      sets.push({
        num1: combo[0],
        num2: combo[1],
        num3: combo[2],
        num4: combo[3],
        num5: combo[4],
        num6: combo[5],
        method: 'JL Wheel Method',
        strategy: 'position-diversity',
      })
    }
  }

  // 부족 시 탐욕 알고리즘으로 보충
  if (sets.length < count) {
    const extra = generateDeterministicSets(pool, trendResults, count - sets.length)
    for (const s of extra) {
      const key = [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].join(',')
      if (!usedKeys.has(key) && sets.length < count) {
        usedKeys.add(key)
        sets.push(s)
      }
    }
  }

  return sets
}

export function generate20Sets(
  available: number[],
  trendResults: TrendNumberResult[],
  allHistoryRows: HistoryRow[] = [],
  drawNo: number = 0,
): GeneratedSet[] {
  const pool = applyHotPoolFilter(available, allHistoryRows, drawNo)
  return generatePositionDiverseSets(pool, allHistoryRows, trendResults, 20)
}
