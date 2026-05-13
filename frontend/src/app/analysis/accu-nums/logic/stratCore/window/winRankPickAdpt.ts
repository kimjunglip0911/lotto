import type { AccumulatedStrategyKey, AdaptiveWindowSelectionOptions, StrategyTopWindow, StrategyWindowMetrics } from '../types';
import { pickTopWindowsByStrategy } from './winRankPickTop';

/** 비슷한 길이의 윈도가 겹치지 않게 골라, 짧은 기간과 긴 기간을 섞어 쓸 때 쓴다. */

const toWindowQualityScore = (row: StrategyTopWindow): number =>
  row.atLeastOneRate * 0.7 + row.avgHits * 0.3 - row.maxMissStreak * 0.006;

/** 상위 Top-N 후보 풀에서 간격 제약(minWindowGap)을 두고 동적으로 pickCount개를 고른다. */
export function pickAdaptiveWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  options: AdaptiveWindowSelectionOptions
): StrategyTopWindow[] {
  const { poolSize, pickCount, minWindowGap = 24, minWindowSize, maxWindowSize } = options;
  const pool = pickTopWindowsByStrategy(aggregates, strategy, Math.max(poolSize, pickCount), {
    minWindowSize,
    maxWindowSize,
  });
  const ranked = [...pool].sort((a, b) => {
    const diff = toWindowQualityScore(b) - toWindowQualityScore(a);
    if (diff !== 0) return diff;
    return a.windowSize - b.windowSize;
  });

  const picked: StrategyTopWindow[] = [];
  for (const row of ranked) {
    if (picked.length >= pickCount) break;
    const tooClose = picked.some((p) => Math.abs(p.windowSize - row.windowSize) < minWindowGap);
    if (!tooClose) {
      picked.push(row);
    }
  }
  if (picked.length < pickCount) {
    for (const row of ranked) {
      if (picked.length >= pickCount) break;
      if (!picked.some((p) => p.windowSize === row.windowSize)) {
        picked.push(row);
      }
    }
  }
  return picked;
}
