import type { AccumulatedStrategyKey, StrategyTopWindow, StrategyWindowMetrics } from '../types';
import { toAtLeastOneRate, toAvgHits } from './winRankMetrics';

/** 여러 윈도 길이 중, 과거 백테스트 지표가 좋은 순으로 전략별 상위 N개 윈도를 고른다. */
export function pickTopWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  topN: number,
  options?: { minWindowSize?: number; maxWindowSize?: number }
): StrategyTopWindow[] {
  const rows = aggregates
    .filter((a) => {
      if (a.strategy !== strategy || a.evaluatedRounds <= 0) return false;
      if (options?.minWindowSize !== undefined && a.windowSize < options.minWindowSize) return false;
      if (options?.maxWindowSize !== undefined && a.windowSize > options.maxWindowSize) return false;
      return true;
    })
    .sort((a, b) => {
      const rateDiff = toAtLeastOneRate(b) - toAtLeastOneRate(a);
      if (rateDiff !== 0) return rateDiff;
      const avgDiff = toAvgHits(b) - toAvgHits(a);
      if (avgDiff !== 0) return avgDiff;
      return a.windowSize - b.windowSize;
    })
    .slice(0, topN);

  return rows.map((a) => ({
    strategy: a.strategy,
    windowSize: a.windowSize,
    atLeastOneRate: toAtLeastOneRate(a),
    avgHits: toAvgHits(a),
    maxMissStreak: a.maxMissStreak,
  }));
}
