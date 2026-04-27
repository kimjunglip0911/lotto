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

type HistoryRow = Pick<ChiSquareHistoryRow, 'draw_no' | 'num1' | 'num2' | 'num3' | 'num4' | 'num5' | 'num6' | 'bonus_num'>

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

type Band = 'front' | 'middle' | 'back'

interface ThemeSpec {
  label: string
  pairInBand?: Band
  tripleInBand?: Band
  pairCountMin?: number
  noConsecutive?: boolean
  oddMin?: number
  oddMax?: number
  bandMin?: Partial<Record<Band, number>>
  bandMax?: Partial<Record<Band, number>>
  sumMin?: number
  sumMax?: number
  uniqueLastDigit?: boolean
  primeMin?: number
  primeMax?: number
  preferLow?: boolean
  preferHigh?: boolean
  preferOdd?: boolean
  preferEven?: boolean
  preferPrime?: boolean
  preferBand?: Band
}

const PRIME_NUMBERS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43])

const THEME_SPECS: ThemeSpec[] = [
  { label: '앞번호 연속 2개', pairInBand: 'front', preferBand: 'front', preferLow: true },
  { label: '뒷번호 연속 2개', pairInBand: 'back', preferBand: 'back', preferHigh: true },
  { label: '중간번호 연속 2개', pairInBand: 'middle', preferBand: 'middle' },
  { label: '연속 숫자 없음', noConsecutive: true },
  { label: '앞번호 연속 3개', tripleInBand: 'front', preferBand: 'front', preferLow: true },
  { label: '뒷번호 연속 3개', tripleInBand: 'back', preferBand: 'back', preferHigh: true },
  // 1209회(2,17,20,35,37,39) 패턴: 고구간 중심이지만 저/중구간도 함께 포함된 혼합형
  { label: '1209 패턴(저중고 혼합+홀수 강세)', bandMin: { front: 1, middle: 1, back: 2 }, oddMin: 3, preferHigh: true, preferOdd: true, preferLow: true },
  // 1219회(1,2,15,28,39,45) 패턴: 앞구간 연속 + 고구간 포함
  { label: '1219 패턴(앞연속+고구간)', pairInBand: 'front', bandMin: { back: 2 }, oddMin: 4, preferHigh: true, preferLow: true },
  { label: '홀수 강세', oddMin: 4, oddMax: 5, preferOdd: true },
  { label: '짝수 강세', oddMin: 1, oddMax: 2, preferEven: true },
  { label: '중간번호 연속 3개', tripleInBand: 'middle', preferBand: 'middle' },
  { label: '연속 2쌍', pairCountMin: 2 },
  { label: '홀짝 균형', oddMin: 3, oddMax: 3 },
  { label: '저구간 강세', bandMin: { front: 3 }, bandMax: { back: 2 }, preferLow: true, preferBand: 'front' },
  { label: '중구간 강세', bandMin: { middle: 3 }, bandMax: { back: 2 }, preferBand: 'middle' },
  { label: '고구간 강세', bandMin: { back: 3 }, bandMax: { front: 2 }, preferHigh: true, preferBand: 'back' },
  { label: '저중고 균형', bandMin: { front: 2, middle: 2, back: 2 }, bandMax: { front: 2, middle: 2, back: 2 } },
  { label: '합계 낮은 조합', sumMax: 130, preferLow: true },
  { label: '합계 높은 조합', sumMin: 160, preferHigh: true },
  { label: '끝수 분산 조합', uniqueLastDigit: true },
  { label: '소수 중심 조합', primeMin: 3, primeMax: 4, preferPrime: true },
  { label: '합성수 중심 조합', primeMin: 1, primeMax: 2, preferEven: true },
]

function getBand(n: number): Band {
  if (n <= 15) return 'front'
  if (n <= 30) return 'middle'
  return 'back'
}

function isInBand(n: number, band: Band): boolean {
  return getBand(n) === band
}

function countConsecutivePairs(nums: number[]): number {
  let count = 0
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] - nums[i] === 1) count++
  }
  return count
}

function hasConsecutiveRunInBand(nums: number[], runLength: number, band: Band): boolean {
  for (let i = 0; i <= nums.length - runLength; i++) {
    let ok = true
    for (let j = i; j < i + runLength - 1; j++) {
      if (nums[j + 1] - nums[j] !== 1) {
        ok = false
        break
      }
    }
    if (!ok) continue
    for (let j = i; j < i + runLength; j++) {
      if (!isInBand(nums[j], band)) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}

function countNonOverlappingPairRuns(nums: number[]): number {
  let count = 0
  let i = 0
  while (i < nums.length - 1) {
    if (nums[i + 1] - nums[i] === 1) {
      count++
      i += 2
      continue
    }
    i++
  }
  return count
}

function countByBand(nums: number[]): Record<Band, number> {
  const out: Record<Band, number> = { front: 0, middle: 0, back: 0 }
  for (const n of nums) out[getBand(n)]++
  return out
}

function countOdd(nums: number[]): number {
  return nums.filter((n) => n % 2 !== 0).length
}

function countPrime(nums: number[]): number {
  return nums.filter((n) => PRIME_NUMBERS.has(n)).length
}

function hasUniqueLastDigit(nums: number[]): boolean {
  return new Set(nums.map((n) => n % 10)).size === nums.length
}

function satisfyTheme(nums: number[], spec: ThemeSpec): boolean {
  const oddCount = countOdd(nums)
  const sum = nums.reduce((acc, cur) => acc + cur, 0)
  const bandCount = countByBand(nums)
  const primeCount = countPrime(nums)

  if (spec.noConsecutive && countConsecutivePairs(nums) > 0) return false
  if (spec.pairInBand && !hasConsecutiveRunInBand(nums, 2, spec.pairInBand)) return false
  if (spec.tripleInBand && !hasConsecutiveRunInBand(nums, 3, spec.tripleInBand)) return false
  if ((spec.pairCountMin ?? 0) > 0 && countNonOverlappingPairRuns(nums) < (spec.pairCountMin ?? 0)) return false
  if ((spec.oddMin ?? 0) > oddCount) return false
  if ((spec.oddMax ?? 6) < oddCount) return false
  if ((spec.sumMin ?? 0) > sum) return false
  if ((spec.sumMax ?? 300) < sum) return false
  if (spec.uniqueLastDigit && !hasUniqueLastDigit(nums)) return false
  if ((spec.primeMin ?? 0) > primeCount) return false
  if ((spec.primeMax ?? 6) < primeCount) return false

  for (const band of ['front', 'middle', 'back'] as const) {
    if ((spec.bandMin?.[band] ?? 0) > bandCount[band]) return false
    if ((spec.bandMax?.[band] ?? 6) < bandCount[band]) return false
  }

  return true
}

function scoreNumberForTheme(
  n: number,
  spec: ThemeSpec,
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
): number {
  let score = (TREND_BONUS[trendMap.get(n) ?? 'topping'] ?? 0) * 2
  score -= (usageCount.get(n) ?? 0) * 2

  if (spec.preferLow) score += (46 - n) * 0.08
  if (spec.preferHigh) score += n * 0.08
  if (spec.preferBand && isInBand(n, spec.preferBand)) score += 1.25
  if (spec.preferOdd && n % 2 !== 0) score += 0.8
  if (spec.preferEven && n % 2 === 0) score += 0.8
  if (spec.preferPrime && PRIME_NUMBERS.has(n)) score += 1

  return score
}

function scoreSet(
  nums: number[],
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
): number {
  let score = 0
  for (const n of nums) {
    score += (TREND_BONUS[trendMap.get(n) ?? 'topping'] ?? 0) * 2
    score -= (usageCount.get(n) ?? 0) * 1.8
    if ((usageCount.get(n) ?? 0) === 0) score += 2.5
  }
  score += (nums[5] - nums[0]) * 0.08
  return score
}

function scoreCoverageGain(
  nums: number[],
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
): number {
  let newPairs = 0
  let newTriples = 0
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (!coveredPairs.has(mkPairKey(nums[i], nums[j]))) newPairs++
      for (let k = j + 1; k < nums.length; k++) {
        if (!coveredTriples.has(mkTripleKey(nums[i], nums[j], nums[k]))) newTriples++
      }
    }
  }
  // "당첨번호가 풀에 있는데 놓침"을 줄이기 위해 조합 커버리지를 강하게 가중
  return newTriples * 8 + newPairs * 2
}

function registerCoverage(
  nums: number[],
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
): void {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      coveredPairs.add(mkPairKey(nums[i], nums[j]))
      for (let k = j + 1; k < nums.length; k++) {
        coveredTriples.add(mkTripleKey(nums[i], nums[j], nums[k]))
      }
    }
  }
}

function combinations(
  nums: number[],
  pick: number,
  onPick: (combo: number[]) => void,
): void {
  const selected: number[] = []
  const dfs = (start: number) => {
    if (selected.length === pick) {
      onPick([...selected])
      return
    }
    const remain = pick - selected.length
    for (let i = start; i <= nums.length - remain; i++) {
      selected.push(nums[i])
      dfs(i + 1)
      selected.pop()
    }
  }
  dfs(0)
}

function buildThemeSet(
  available: number[],
  spec: ThemeSpec,
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
  usedSetKeys: Set<string>,
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
  enforceTheme: boolean = true,
): number[] | null {
  const ranked = [...available].sort((a, b) => {
    const sa = scoreNumberForTheme(a, spec, trendMap, usageCount)
    const sb = scoreNumberForTheme(b, spec, trendMap, usageCount)
    if (sa !== sb) return sb - sa
    return a - b
  })

  const poolSizes = [18, 24, Math.min(30, available.length), available.length]

  for (const poolSize of poolSizes) {
    const pool = ranked.slice(0, poolSize).sort((a, b) => a - b)
    let best: number[] | null = null
    let bestScore = -Infinity

    combinations(pool, 6, (combo) => {
      const nums = [...combo].sort((a, b) => a - b)
      const key = nums.join(',')
      if (usedSetKeys.has(key)) return
      if (enforceTheme && !satisfyTheme(nums, spec)) return

      const score =
        scoreSet(nums, trendMap, usageCount) +
        scoreCoverageGain(nums, coveredPairs, coveredTriples)
      if (score > bestScore) {
        bestScore = score
        best = nums
      }
    })

    if (best) return best
  }

  return null
}

function buildSetFromIndices(pool: number[], indices: number[]): number[] | null {
  const picked = indices.map((idx) => pool[idx])
  const uniq = [...new Set(picked)].sort((a, b) => a - b)
  if (uniq.length !== 6) return null
  return uniq
}

function topUpWithRotatingPatterns(
  pool: number[],
  usageCount: Map<number, number>,
  usedSetKeys: Set<string>,
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
  targetCount: number,
  sets: GeneratedSet[],
): void {
  const N = pool.length
  if (N < 6) return

  for (let step = 1; step < N && sets.length < targetCount; step++) {
    for (let start = 0; start < N && sets.length < targetCount; start++) {
      const indices = Array.from({ length: 6 }, (_, k) => (start + k * step) % N)
      const nums = buildSetFromIndices(pool, indices)
      if (!nums) continue
      const key = nums.join(',')
      if (usedSetKeys.has(key)) continue

      usedSetKeys.add(key)
      for (const n of nums) usageCount.set(n, (usageCount.get(n) ?? 0) + 1)
      registerCoverage(nums, coveredPairs, coveredTriples)
      sets.push({
        num1: nums[0],
        num2: nums[1],
        num3: nums[2],
        num4: nums[3],
        num5: nums[4],
        num6: nums[5],
        method: 'JL Wheel Method',
        strategy: 'deterministic',
      })
    }
  }
}

function relaxThemeSpec(spec: ThemeSpec): ThemeSpec {
  return {
    ...spec,
    // 핵심 테마 조건은 유지하고, 생성 실패를 일으키기 쉬운 제한만 완화한다.
    pairCountMin: spec.pairCountMin ? Math.max(1, spec.pairCountMin - 1) : spec.pairCountMin,
    oddMin: spec.oddMin ? Math.max(0, spec.oddMin - 1) : spec.oddMin,
    oddMax: spec.oddMax ? Math.min(6, spec.oddMax + 1) : spec.oddMax,
    sumMin: spec.sumMin ? Math.max(21, spec.sumMin - 10) : spec.sumMin,
    sumMax: spec.sumMax ? Math.min(255, spec.sumMax + 10) : spec.sumMax,
    primeMin: spec.primeMin ? Math.max(0, spec.primeMin - 1) : spec.primeMin,
    primeMax: spec.primeMax ? Math.min(6, spec.primeMax + 1) : spec.primeMax,
    bandMin: spec.bandMin
      ? {
          front: spec.bandMin.front ? Math.max(0, spec.bandMin.front - 1) : spec.bandMin.front,
          middle: spec.bandMin.middle ? Math.max(0, spec.bandMin.middle - 1) : spec.bandMin.middle,
          back: spec.bandMin.back ? Math.max(0, spec.bandMin.back - 1) : spec.bandMin.back,
        }
      : spec.bandMin,
    bandMax: spec.bandMax
      ? {
          front: spec.bandMax.front ? Math.min(6, spec.bandMax.front + 1) : spec.bandMax.front,
          middle: spec.bandMax.middle ? Math.min(6, spec.bandMax.middle + 1) : spec.bandMax.middle,
          back: spec.bandMax.back ? Math.min(6, spec.bandMax.back + 1) : spec.bandMax.back,
        }
      : spec.bandMax,
  }
}

export function generateThemeDiverseSets(
  available: number[],
  trendResults: TrendNumberResult[],
  count: number = 20,
): GeneratedSet[] {
  if (available.length < 6) return []

  const pool = [...new Set(available)].sort((a, b) => a - b)
  const trendMap = new Map<number, string>(trendResults.map((t) => [t.number, t.trend]))
  const usageCount = new Map<number, number>(pool.map((n) => [n, 0]))
  const usedSetKeys = new Set<string>()
  const coveredPairs = new Set<string>()
  const coveredTriples = new Set<string>()
  const sets: GeneratedSet[] = []

  for (let i = 0; i < Math.min(count, THEME_SPECS.length); i++) {
    const spec = THEME_SPECS[i]
    let nums = buildThemeSet(
      pool,
      spec,
      trendMap,
      usageCount,
      usedSetKeys,
      coveredPairs,
      coveredTriples,
      true,
    )
    if (!nums) {
      nums = buildThemeSet(
        pool,
        relaxThemeSpec(spec),
        trendMap,
        usageCount,
        usedSetKeys,
        coveredPairs,
        coveredTriples,
        true,
      )
    }
    // 마지막 보완: 테마를 강제하지 않고(선호만 유지) 커버리지 최적 후보를 확보
    if (!nums) {
      nums = buildThemeSet(
        pool,
        relaxThemeSpec(spec),
        trendMap,
        usageCount,
        usedSetKeys,
        coveredPairs,
        coveredTriples,
        false,
      )
    }
    if (!nums) continue

    usedSetKeys.add(nums.join(','))
    for (const n of nums) usageCount.set(n, (usageCount.get(n) ?? 0) + 1)
    registerCoverage(nums, coveredPairs, coveredTriples)

    sets.push({
      num1: nums[0],
      num2: nums[1],
      num3: nums[2],
      num4: nums[3],
      num5: nums[4],
      num6: nums[5],
      method: 'JL Wheel Method',
      strategy: `theme:${spec.label}`,
    })
  }

  if (sets.length < count) {
    const extra = generateDeterministicSets(pool, trendResults, count - sets.length)
    for (const s of extra) {
      const key = [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].join(',')
      if (!usedSetKeys.has(key) && sets.length < count) {
        usedSetKeys.add(key)
        registerCoverage([s.num1, s.num2, s.num3, s.num4, s.num5, s.num6], coveredPairs, coveredTriples)
        sets.push(s)
      }
    }
  }

  // 안전장치: 어떤 경우에도 목표 개수(기본 20개)를 채우도록 회전 패턴으로 추가 보충.
  if (sets.length < count) {
    topUpWithRotatingPatterns(pool, usageCount, usedSetKeys, coveredPairs, coveredTriples, count, sets)
  }

  // 최종 안전장치: 조합 공간이 너무 작아 유니크 20세트가 불가능한 경우에도
  // UI/저장 일관성을 위해 20개를 강제로 채운다(필요 시 중복 허용).
  if (sets.length < count) {
    const N = pool.length
    const stride = Math.max(1, Math.floor(N / 3))
    for (let i = 0; sets.length < count && i < count * 10; i++) {
      const indices = [
        i % N,
        (i + 1) % N,
        (i + stride) % N,
        (i + stride + 1) % N,
        (i + 2 * stride) % N,
        (i + 2 * stride + 1) % N,
      ]
      const nums = buildSetFromIndices(pool, indices)
      if (!nums) continue
      sets.push({
        num1: nums[0],
        num2: nums[1],
        num3: nums[2],
        num4: nums[3],
        num5: nums[4],
        num6: nums[5],
        method: 'JL Wheel Method',
        strategy: 'deterministic',
      })
    }
  }

  return sets
}

export function generate20Sets(
  available: number[],
  trendResults: TrendNumberResult[],
  _allHistoryRows: HistoryRow[] = [],
): GeneratedSet[] {
  const targetCount = 20
  const themeOnlySets = generateThemeDiverseSets(available, trendResults, targetCount)
  return themeOnlySets.slice(0, targetCount).map((set) => ({
    ...set,
    strategy: set.strategy?.startsWith('theme:') ? set.strategy : 'theme-diversity',
  }))
}
