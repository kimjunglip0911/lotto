import type { AccumulatedStrategyKey } from '../types/stratEval';

export const ACCUMULATED_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = [
  'top4Frequency',
  'bottom4Frequency',
  'nearestMean4',
  'twoHotTwoCold',
] as const;

/** UI·집중 분석: 평균 근접 + 상위2·하위2 */
export const ACCUMULATED_FOCUS_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = [
  'nearestMean4',
  'twoHotTwoCold',
] as const;
