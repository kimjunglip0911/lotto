/** 단일 전략·기간에 대한 추천 4개·점수 부여 */

import type { WinningNumberRow } from '../../types';
import { buildNumberCounts } from '../numCounts';
import { pickFourByStrategy } from './numPick';
import type {
  AccumulatedStrategyKey,
  StrategyRecommendation,
  StrategyWindowMetrics,
} from './types';
import { sliceWindowTail } from './winSlice';
import { toAtLeastOneRate, toAvgHits } from './winRank';

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

/** 선택 draw 이전 데이터에서 특정 전략/기간으로 추천 4개를 만든다. */
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
