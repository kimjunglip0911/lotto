import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';
import type { StrategyWindowMetrics } from '../types/stratEval';
import type { AccumulatedStrategySelection, StrategyChartData, WinningNumberRow } from '../types';
import { buildAccumulatedCountExclusionResult } from './accuCntExt';
import { buildStrategyRecommendation } from './stratEval';
import { buildStrategy104Chart, findStrategyAggregate } from './stratSelChart';
import { buildStrategyNumberPicks } from './stratSelPicks';

/** 평가된 지표로 104회 차트·극값 제외 finalNumberPlan을 조립한다. */
export const buildAccumulatedStrategySelectionFromAggregates = (
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregates: StrategyWindowMetrics[],
): AccumulatedStrategySelection => {
  const fullWindowSize = rangeRowsSortedAsc.length;
  const twoYearSize = ACCUMULATED_STRATEGY_WINDOW_DRAWS;

  const aggTop2y = findStrategyAggregate(aggregates, 'top4Frequency', twoYearSize);
  const aggBot2y = findStrategyAggregate(aggregates, 'bottom4Frequency', twoYearSize);
  const aggTopFull = findStrategyAggregate(aggregates, 'top4Frequency', fullWindowSize);
  const aggBotFull = findStrategyAggregate(aggregates, 'bottom4Frequency', fullWindowSize);

  if (!aggTop2y || !aggBot2y || !aggTopFull || !aggBotFull) {
    return { strategyCharts: [], finalNumberPlan: null };
  }

  const strategyCharts: StrategyChartData[] = [
    buildStrategy104Chart(rangeRowsSortedAsc, aggTop2y, 'top4Frequency', '상위 출현 4', '2년'),
    buildStrategy104Chart(rangeRowsSortedAsc, aggBot2y, 'bottom4Frequency', '하위 출현 4', '2년'),
  ];

  const recTop2y = buildStrategyRecommendation({
    strategy: 'top4Frequency',
    windowSize: twoYearSize,
    allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
    aggregate: aggTop2y,
  });
  const recBot2y = buildStrategyRecommendation({
    strategy: 'bottom4Frequency',
    windowSize: twoYearSize,
    allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
    aggregate: aggBot2y,
  });
  const recTopFull = buildStrategyRecommendation({
    strategy: 'top4Frequency',
    windowSize: fullWindowSize,
    allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
    aggregate: aggTopFull,
  });
  const recBotFull = buildStrategyRecommendation({
    strategy: 'bottom4Frequency',
    windowSize: fullWindowSize,
    allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
    aggregate: aggBotFull,
  });

  const { excludedUnique } = buildAccumulatedCountExclusionResult(rangeRowsSortedAsc);

  return {
    strategyCharts,
    finalNumberPlan: {
      commonNumbers: [],
      finalNumbers: [...excludedUnique],
      strategyPicks: buildStrategyNumberPicks(
        twoYearSize,
        fullWindowSize,
        recTop2y,
        recBot2y,
        recTopFull,
        recBotFull,
      ),
    },
  };
};
