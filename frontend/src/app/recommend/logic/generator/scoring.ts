import { mkPairKey } from '@/app/recommend/logic/generator/coverage'
import type { HistorySignals } from '@/app/recommend/logic/generator/historySignals'
import { isInBand, PRIME_NUMBERS, ThemeSpec } from '@/app/recommend/logic/generator/theme'

export const TREND_BONUS: Record<string, number> = {
  recovering: 2,
  up_cont: 1,
  topping: 0,
  down_cont: -1,
}

/** 이력 단번 정규화 가중(트렌드 EMA와 역할 분리, 소량 — 기본 1.05 대비 소폭 상향) */
const HISTORY_NUMBER_WEIGHT = 1.18
/** 이력 페어 정규화 가중 */
const HISTORY_PAIR_WEIGHT = 0.44

/** 최근 주번 출현 빈도를 0~스케일로 반영(트렌드와 이중 과대 방지 위해 작게) */
export function scoreHistoryForNumber(n: number, signals: HistorySignals | null): number {
  if (!signals || signals.maxNumberHits === 0) return 0
  const c = signals.numberHitCount.get(n) ?? 0
  return (c / signals.maxNumberHits) * HISTORY_NUMBER_WEIGHT
}

/**
 * 최근 윈도우 출현 비율 상위에 소량 가산(탐욕 보충 세트 전용으로 generator에서만 사용).
 */
export function hotTierBonusForNumber(n: number, signals: HistorySignals | null): number {
  if (!signals || signals.maxNumberHits === 0) return 0
  const c = signals.numberHitCount.get(n) ?? 0
  const r = c / signals.maxNumberHits
  if (r >= 0.85) return 0.55
  if (r >= 0.65) return 0.32
  if (r >= 0.45) return 0.14
  return 0
}

/** 조합 내 페어들의 공출현 이력 합산 */
export function scoreHistoryForSet(nums: number[], signals: HistorySignals | null): number {
  if (!signals || signals.maxPairHits === 0 || nums.length < 2) return 0
  let sum = 0
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = mkPairKey(nums[i], nums[j])
      const c = signals.pairHitCount.get(key) ?? 0
      sum += c / signals.maxPairHits
    }
  }
  return sum * HISTORY_PAIR_WEIGHT
}

export function scoreNumberForTheme(
  n: number,
  spec: ThemeSpec,
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
  historySignals: HistorySignals | null = null,
): number {
  let score = (TREND_BONUS[trendMap.get(n) ?? 'topping'] ?? 0) * 2
  score -= (usageCount.get(n) ?? 0) * 1.82

  if (spec.preferLow) score += (46 - n) * 0.08
  if (spec.preferHigh) score += n * 0.08
  if (spec.preferBand && isInBand(n, spec.preferBand)) score += 1.25
  if (spec.preferOdd && n % 2 !== 0) score += 0.8
  if (spec.preferEven && n % 2 === 0) score += 0.8
  if (spec.preferPrime && PRIME_NUMBERS.has(n)) score += 1

  score += scoreHistoryForNumber(n, historySignals)

  return score
}

export function scoreSet(
  nums: number[],
  trendMap: Map<number, string>,
  usageCount: Map<number, number>,
  historySignals: HistorySignals | null = null,
): number {
  let score = 0
  for (const n of nums) {
    score += (TREND_BONUS[trendMap.get(n) ?? 'topping'] ?? 0) * 2
    score -= (usageCount.get(n) ?? 0) * 1.68
    if ((usageCount.get(n) ?? 0) === 0) score += 2.5
  }
  score += (nums[5] - nums[0]) * 0.08
  score += scoreHistoryForSet(nums, historySignals)
  return score
}

export function trendBonusForNumber(num: number, trendMap: Map<number, string>): number {
  return TREND_BONUS[trendMap.get(num) ?? 'topping'] ?? 0
}
