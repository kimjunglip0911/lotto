import type { WinningNumberRow } from '../../../types';
import { buildNumberCounts } from '../../numCounts';
import { pickFourByStrategy } from '../pick/numPick';
import type { AccumulatedStrategyKey, StrategyRecommendation, StrategyWindowMetrics } from '../types';
import { sliceWindowTail } from '../window/winSlice';
import { toAtLeastOneRate, toAvgHits } from '../window/winRankMetrics';

/** 선택 회차 이전 당첨만으로, 한 전략·한 기간(예: 직전 104회)에 대한 추천 4개와 점수표를 만든다. */

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
