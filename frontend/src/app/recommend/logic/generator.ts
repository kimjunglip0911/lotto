import { combinations, mkPairKey, mkTripleKey, registerCoverage, scoreCoverageGain, topUpWithRotatingPatterns, buildSetFromIndices } from '@/app/recommend/logic/generator/coverage'
import { buildHistorySignals, type HistorySignals } from '@/app/recommend/logic/generator/historySignals'
import { hotTierBonusForNumber, scoreHistoryForNumber, scoreNumberForTheme, scoreSet, trendBonusForNumber } from '@/app/recommend/logic/generator/scoring'
import { relaxThemeSpec, satisfyTheme, THEME_SPECS, ThemeSpec } from '@/app/recommend/logic/generator/theme'
import { GeneratedSet, TrendNumberResult, WinningHistoryRow } from '@/app/recommend/logic/types'

/**
 * 결정론적 탐욕 트리플 커버리지 알고리즘.
 *
 * 동작 방식:
 *   1. 세트 s마다 "강제 시작 번호"를 전체 풀에 고르게 분산시켜 첫 번호를 고정한다.
 *   2. 나머지 5개는 탐욕 점수(신규 트리플·페어 + 추세 + 최근 이력 단번 + 세트 간 사용량 균형)가
 *      가장 높은 번호를 순서대로 선택한다. 동점이면 작은 번호를 선택한다.
 *   3. 이미 생성된 세트와 동일한 조합이면 건너뛰고 다음 강제 시작 인덱스를 시도한다.
 *
 * 보장:
 *   - 동일한 available + trendResults + 동일 당첨 이력 입력 → 항상 동일한 결과(Math.random 미사용)
 *   - 전체 풀에 걸쳐 번호가 비교적 고르게 분포하도록 유도
 */
export function generateDeterministicSets(
  available: number[],
  trendResults: TrendNumberResult[],
  count: number = 20,
  historySignals: HistorySignals | null = null,
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

      const totalUses = sorted.reduce((acc, n) => acc + (usageCount.get(n) ?? 0), 0)
      const meanUse = totalUses / N

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

        const tBonus = trendBonusForNumber(num, trendMap)
        const fPenalty = (usageCount.get(num) ?? 0) * 2.55
        const hist = scoreHistoryForNumber(num, historySignals)
        const hotB = hotTierBonusForNumber(num, historySignals)
        // 세트 간으로 아직 적게 쓰인 가용 번호에 소프트 보너스(표현력 보조)
        const spreadBonus = Math.max(0, meanUse - (usageCount.get(num) ?? 0)) * 0.45
        const score = newTriples * 6 + newPairs * 2 + tBonus + hist + hotB * 0.55 + spreadBonus - fPenalty

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

function buildThemeSet(
  available: number[],
  spec: ThemeSpec,
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
  usedSetKeys: Set<string>,
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
  historySignals: HistorySignals | null,
  enforceTheme: boolean = true,
): number[] | null {
  const ranked = [...available].sort((a, b) => {
    const sa = scoreNumberForTheme(a, spec, trendMap, usageCount, historySignals)
    const sb = scoreNumberForTheme(b, spec, trendMap, usageCount, historySignals)
    if (sa !== sb) return sb - sa
    return a - b
  })

  // 소폭 넓힌 풀: 테마 조합 후보에 번호 다양성을 조금 더 실어 회차당 적중 여지를 확대
  const poolSizes = [19, 25, Math.min(32, available.length), available.length]

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
        scoreSet(nums, trendMap, usageCount, historySignals) +
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


export function generateThemeDiverseSets(
  available: number[],
  trendResults: TrendNumberResult[],
  count: number = 20,
  historySignals: HistorySignals | null = null,
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
      historySignals,
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
        historySignals,
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
        historySignals,
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
    const extra = generateDeterministicSets(pool, trendResults, count - sets.length, historySignals)
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
  allHistoryRows: WinningHistoryRow[] = [],
): GeneratedSet[] {
  const historySignals = buildHistorySignals(allHistoryRows)
  const targetCount = 20
  const themeOnlySets = generateThemeDiverseSets(available, trendResults, targetCount, historySignals)
  return themeOnlySets.slice(0, targetCount).map((set) => ({
    ...set,
    strategy: set.strategy?.startsWith('theme:') ? set.strategy : 'theme-diversity',
  }))
}
