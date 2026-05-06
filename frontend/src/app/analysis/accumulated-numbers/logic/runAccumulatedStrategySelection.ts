import {
  buildStrategyRecommendation,
  runAccumulatedStrategyEvaluation,
  sliceWindowTail,
} from './accumulatedStrategyEvaluation';
import { buildNumberCounts } from './numberCounts';
import { toAtLeastOneRate, toAvgHits } from './strategyEvaluation/windowRanking';
import type { StrategyWindowMetrics } from './strategyEvaluation/types';
import type { FinalNumberPlan, StrategyChartData, StrategyNumberPick, WinningNumberRow } from '../types';
import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';

const ACCUMULATED_SINGLE_STRATEGY_KEYS = ['nearestMean4'] as const;

export type AccumulatedStrategySelection = {
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};

function buildNearestMean104Chart(
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregate: StrategyWindowMetrics
): StrategyChartData {
  const windowSize = ACCUMULATED_STRATEGY_WINDOW_DRAWS;
  const rows = sliceWindowTail(rangeRowsSortedAsc, windowSize);
  return {
    key: `nearestMean4-${windowSize}`,
    title: `평균근접 전략 (이전 ${windowSize}회차, 2년)`,
    counts: buildNumberCounts(rows),
    analyzedDrawCount: rows.length,
    noDataMessage: `이전 ${windowSize}회차 데이터가 부족해 전략 차트를 표시할 수 없습니다.`,
    strategyLabel: '평균근접',
    windowSize,
    atLeastOneRate: toAtLeastOneRate(aggregate),
    avgHits: toAvgHits(aggregate),
    maxMissStreak: aggregate.maxMissStreak,
  };
}

/**
 * 이미 계산된 전략·윈도 지표로 전략 차트·최종 4개를 만든다(스냅샷 일괄 등 증분 평가와 조합).
 */
export function buildAccumulatedStrategySelectionFromAggregates(
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregates: StrategyWindowMetrics[]
): AccumulatedStrategySelection {
  const windowSize = ACCUMULATED_STRATEGY_WINDOW_DRAWS;
  const aggregate = aggregates.find((a) => a.strategy === 'nearestMean4' && a.windowSize === windowSize);

  if (!aggregate) {
    return { strategyCharts: [], finalNumberPlan: null };
  }

  const strategyCharts = [buildNearestMean104Chart(rangeRowsSortedAsc, aggregate)];

  const recommendation = buildStrategyRecommendation({
    strategy: 'nearestMean4',
    windowSize,
    allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
    aggregate,
  });

  const finalNumbers = [...recommendation.numbers].sort((a, b) => a - b);

  const strategyPicks: StrategyNumberPick[] = [
    {
      strategyKey: 'nearestMean4',
      strategyLabel: '평균근접',
      windowSizes: [windowSize],
      numbers: recommendation.numbers,
      atLeastOneRate: recommendation.metrics.atLeastOneRate,
      avgHits: recommendation.metrics.avgHits,
      maxMissStreak: recommendation.metrics.maxMissStreak,
    },
  ];

  return {
    strategyCharts,
    finalNumberPlan: {
      commonNumbers: [],
      finalNumbers,
      strategyPicks,
    },
  };
}

/**
 * 선택 회차 기준 이전 당첨 행만으로 전략 차트·최종 4개를 계산한다.
 * `draw_no < anchor` 구간이 오름차순으로 정렬된 배열을 넘긴다.
 */
export function runAccumulatedStrategySelection(
  rangeRowsSortedAsc: WinningNumberRow[]
): AccumulatedStrategySelection {
  const drawNumbersToEvaluate = rangeRowsSortedAsc.map((r) => r.draw_no).filter((d) => d >= 100);
  if (drawNumbersToEvaluate.length === 0) {
    return { strategyCharts: [], finalNumberPlan: null };
  }

  const { aggregates } = runAccumulatedStrategyEvaluation({
    allRowsSortedAsc: rangeRowsSortedAsc,
    drawNumbersToEvaluate,
    windowSizes: [ACCUMULATED_STRATEGY_WINDOW_DRAWS],
    strategyKeys: ACCUMULATED_SINGLE_STRATEGY_KEYS,
  });

  return buildAccumulatedStrategySelectionFromAggregates(rangeRowsSortedAsc, aggregates);
}
