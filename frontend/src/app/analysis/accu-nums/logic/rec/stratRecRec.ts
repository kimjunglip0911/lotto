import type { WinningNumberRow } from '../../types';
import { buildNumberCounts } from '../numCounts';
import { pickFourByStrategy } from '../pick/numPick';
import type { AccumulatedStrategyKey, StrategyRecommendation, StrategyWindowMetrics } from '../../types/stratEval';
import { sliceWindowTail } from '../window/winSlice';
import { toAtLeastOneRate, toAvgHits } from '../window/winRankMetrics';

/** ? íƒ ?Œì°¨ ?´ì „ ?¹ì²¨ë§Œìœ¼ë¡? ???„ëµÂ·??ê¸°ê°„(?? ì§ì „ 104?????€??ì¶”ì²œ 4ê°œì? ?ìˆ˜?œë? ë§Œë“ ?? */

function toScoreByNumber(
  strategy: AccumulatedStrategyKey,
  aggregate: StrategyWindowMetrics,
  numbers: number[]
): Record<number, number> {
  const base = toAtLeastOneRate(aggregate) * 0.7 + toAvgHits(aggregate) * 0.3;
  const spreadWeight = strategy === 'nearestMean4' ? 0.02 : 0.015;
  const sorted = [...numbers].sort((a, b) => a - b);
  const entries = sorted.map((n, idx) => [n, base - idx * spreadWeight] as const);
  return Object.fromEntries(entries) as Record<number, number>;
}

export function buildStrategyRecommendation(params: {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  allRowsBeforeSelectedDraw: WinningNumberRow[];
  aggregate: StrategyWindowMetrics;
}): StrategyRecommendation {
  const { strategy, windowSize, allRowsBeforeSelectedDraw, aggregate } = params;
  const windowRows = sliceWindowTail(allRowsBeforeSelectedDraw, windowSize);
  const counts = buildNumberCounts(windowRows);
  const numbers = pickFourByStrategy(counts, strategy);
  return {
    strategy,
    windowSize,
    numbers,
    scoreByNumber: toScoreByNumber(strategy, aggregate, numbers),
    metrics: {
      atLeastOneRate: toAtLeastOneRate(aggregate),
      avgHits: toAvgHits(aggregate),
      maxMissStreak: aggregate.maxMissStreak,
    },
  };
}
