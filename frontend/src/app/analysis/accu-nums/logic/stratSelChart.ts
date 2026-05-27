import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';
import type { AccumulatedStrategyKey, StrategyWindowMetrics } from '../types/stratEval';
import type { StrategyChartData, WinningNumberRow } from '../types';
import { buildNumberCounts } from './numCounts';
import { sliceWindowTail } from './stratEval';
import { toAtLeastOneRate, toAvgHits } from './window/winRank';

export const findStrategyAggregate = (
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  windowSize: number,
): StrategyWindowMetrics | undefined =>
  aggregates.find((a) => a.strategy === strategy && a.windowSize === windowSize);

export const buildStrategy104Chart = (
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregate: StrategyWindowMetrics,
  strategy: AccumulatedStrategyKey,
  strategyLabel: string,
  bandLabel: string,
): StrategyChartData => {
  const windowSize = ACCUMULATED_STRATEGY_WINDOW_DRAWS;
  const rows = sliceWindowTail(rangeRowsSortedAsc, windowSize);
  return {
    key: `${strategy}-${windowSize}`,
    title: `${strategyLabel} (${bandLabel} · 이전 ${windowSize}회차)`,
    counts: buildNumberCounts(rows),
    analyzedDrawCount: rows.length,
    noDataMessage: `이전 ${windowSize}회차 데이터가 부족해 전략 차트를 표시할 수 없습니다.`,
    strategyLabel,
    windowSize,
    atLeastOneRate: toAtLeastOneRate(aggregate),
    avgHits: toAvgHits(aggregate),
    maxMissStreak: aggregate.maxMissStreak,
  };
};
