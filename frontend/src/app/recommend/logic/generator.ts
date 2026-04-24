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

// ─── 범위 기반 커버리지 알고리즘 ──────────────────────────────────────────────

/**
 * 핫 풀 내 번호 쌍의 공동출현 횟수 계산 (최근 N회 기준).
 */
function computePairCooccurrence(hotPool: number[], rows: HistoryRow[]): Map<string, number> {
  const cooccur = new Map<string, number>()
  const hotSet = new Set(hotPool)
  const allNums = (r: HistoryRow) => [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.bonus_num]
  for (const r of rows) {
    const nums = allNums(r).filter((n) => hotSet.has(n))
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = mkPairKey(nums[i], nums[j])
        cooccur.set(key, (cooccur.get(key) ?? 0) + 1)
      }
    }
  }
  return cooccur
}

function cTripleScore(triple: [number, number, number], cooccur: Map<string, number>): number {
  const [a, b, c] = triple
  return (cooccur.get(mkPairKey(a, b)) ?? 0) + (cooccur.get(mkPairKey(a, c)) ?? 0) + (cooccur.get(mkPairKey(b, c)) ?? 0)
}

/**
 * 범위 기반 20세트 생성 알고리즘.
 *
 * 적용 조건:
 *   - 핫 풀에서 31-45 범위 번호(C구간)가 정확히 6개 → C(6,3) = 20 트리플 전수 커버
 *   - 핫 풀에서 16-20 범위 번호(B구간)가 정확히 2개 → 모든 세트에 고정
 *
 * 알고리즘:
 *   1. B(16-20) 2개를 모든 세트에 고정
 *   2. C(31-45) 6개의 트리플 20가지를 공동출현 점수 내림차순으로 정렬
 *   3. A(1-15) 번호를 미출현 기간(streak) 내림차순으로 순환 배정
 *   → 각 세트: 1A + 2B + 3C = 6개
 *
 * 이 조건을 만족하지 않으면 null 반환 (greedy 폴백).
 */
function generateRangeBasedSets(
  hotPool: number[],
  allHistoryRows: HistoryRow[],
  drawNo: number,
  count: number,
): GeneratedSet[] | null {
  const A = hotPool.filter((n) => n >= 1 && n <= 15).sort((a, b) => a - b)
  const B = hotPool.filter((n) => n >= 16 && n <= 20).sort((a, b) => a - b)
  const C = hotPool.filter((n) => n >= 31 && n <= 45).sort((a, b) => a - b)

  if (C.length !== 6 || B.length !== 2 || A.length === 0) return null

  const allNums = (r: HistoryRow) => [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.bonus_num]

  // A 번호별 미출현 기간 계산 (streak DESC → 가장 오래 쉰 번호부터)
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
  const A_sorted = [...A].sort((a, b) => {
    const ds = streak(b) - streak(a)
    return ds !== 0 ? ds : a - b
  })

  // C 트리플 20가지를 공동출현 점수 내림차순 정렬
  const recent200 = allHistoryRows.slice(-200)
  const cooccur = computePairCooccurrence(hotPool, recent200)
  const cTriples: [number, number, number][] = []
  for (let i = 0; i < C.length; i++)
    for (let j = i + 1; j < C.length; j++)
      for (let k = j + 1; k < C.length; k++)
        cTriples.push([C[i], C[j], C[k]])
  cTriples.sort((x, y) => cTripleScore(y, cooccur) - cTripleScore(x, cooccur))

  const sets: GeneratedSet[] = []
  for (let i = 0; i < Math.min(count, cTriples.length); i++) {
    const triple = cTriples[i]
    const aNum = A_sorted[i % A_sorted.length]
    const combo = [...[aNum], ...B, ...triple].sort((a, b) => a - b)
    sets.push({
      num1: combo[0],
      num2: combo[1],
      num3: combo[2],
      num4: combo[3],
      num5: combo[4],
      num6: combo[5],
      method: 'JL Wheel Method',
      strategy: 'range-coverage',
    })
  }

  return sets.length === count ? sets : null
}

export function generate20Sets(
  available: number[],
  trendResults: TrendNumberResult[],
  allHistoryRows: HistoryRow[] = [],
  drawNo: number = 0,
): GeneratedSet[] {
  const pool = applyHotPoolFilter(available, allHistoryRows, drawNo)

  // 범위 기반 알고리즘 우선 시도 (|C|=6, |B|=2 조건)
  if (allHistoryRows.length > 0 && drawNo > 0) {
    const rangeSets = generateRangeBasedSets(pool, allHistoryRows, drawNo, 20)
    if (rangeSets !== null) return rangeSets
  }

  // 폴백: 탐욕 트리플 커버리지 알고리즘
  return generateDeterministicSets(pool, trendResults, 20)
}
