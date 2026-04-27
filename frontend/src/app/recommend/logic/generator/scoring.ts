import { isInBand, PRIME_NUMBERS, ThemeSpec } from '@/app/recommend/logic/generator/theme'

export const TREND_BONUS: Record<string, number> = {
  recovering: 2,
  up_cont: 1,
  topping: 0,
  down_cont: -1,
}

export function scoreNumberForTheme(
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

export function scoreSet(
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

export function trendBonusForNumber(num: number, trendMap: Map<number, string>): number {
  return TREND_BONUS[trendMap.get(num) ?? 'topping'] ?? 0
}
