import {
  ACCUMULATED_FOCUS_STRATEGY_KEYS,
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
  getDefaultEvaluationWindowSizes,
  runAccumulatedStrategyEvaluation,
} from './accumulatedStrategyEvaluation';
import { buildStrategyChartsFromTopWindows } from './buildStrategyChartsFromTopWindows';
import { pickFocusStrategyTopWindows } from './pickFocusStrategyTopWindows';
import type { StrategyWindowMetrics } from './strategyEvaluation/types';
import type { FinalNumberPlan, StrategyChartData, StrategyNumberPick, WinningNumberRow } from '../types';

/** 평가 윈도 스윕 상한 — `useAccumulatedNumbersData`와 동일 */
export const ACCUMULATED_EXTENDED_WINDOW_MAX = 1208;

export type AccumulatedStrategySelection = {
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};

/**
 * 이미 계산된 전략·윈도 지표로 전략 차트·최종 4개를 만든다(스냅샷 일괄 등 증분 평가와 조합).
 */
export function buildAccumulatedStrategySelectionFromAggregates(
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregates: StrategyWindowMetrics[]
): AccumulatedStrategySelection {
  const aggByKey = new Map<string, StrategyWindowMetrics>();
  for (const a of aggregates) {
    aggByKey.set(`${a.strategy}\t${a.windowSize}`, a);
  }

  const { shortTop, longTop } = pickFocusStrategyTopWindows(aggregates);

  const strategyCharts = buildStrategyChartsFromTopWindows(rangeRowsSortedAsc, shortTop, longTop);

  const shortRecs = shortTop
    .map((w) => {
      const agg = aggByKey.get(`${w.strategy}\t${w.windowSize}`);
      if (!agg) return null;
      return buildStrategyRecommendation({
        strategy: 'nearestMean4',
        windowSize: w.windowSize,
        allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
        aggregate: agg,
      });
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const longRecs = longTop
    .map((w) => {
      const agg = aggByKey.get(`${w.strategy}\t${w.windowSize}`);
      if (!agg) return null;
      return buildStrategyRecommendation({
        strategy: 'twoHotTwoCold',
        windowSize: w.windowSize,
        allRowsBeforeSelectedDraw: rangeRowsSortedAsc,
        aggregate: agg,
      });
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const shortRecommendation = combineStrategyRecommendations(shortRecs);
  const longRecommendation = combineStrategyRecommendations(longRecs);

  if (!shortRecommendation || !longRecommendation) {
    return { strategyCharts, finalNumberPlan: null };
  }

  const finalSelection = buildFinalNumberSelection(shortRecommendation, longRecommendation);

  const strategyPicks: StrategyNumberPick[] = [
    {
      strategyKey: 'nearestMean4',
      strategyLabel: '평균근접',
      windowSizes: shortTop.map((w) => w.windowSize),
      numbers: shortRecommendation.numbers,
      atLeastOneRate: shortRecommendation.metrics.atLeastOneRate,
      avgHits: shortRecommendation.metrics.avgHits,
      maxMissStreak: shortRecommendation.metrics.maxMissStreak,
    },
    {
      strategyKey: 'twoHotTwoCold',
      strategyLabel: '상2+하2',
      windowSizes: longTop.map((w) => w.windowSize),
      numbers: longRecommendation.numbers,
      atLeastOneRate: longRecommendation.metrics.atLeastOneRate,
      avgHits: longRecommendation.metrics.avgHits,
      maxMissStreak: longRecommendation.metrics.maxMissStreak,
    },
  ];

  return {
    strategyCharts,
    finalNumberPlan: {
      commonNumbers: finalSelection.commonNumbers,
      finalNumbers: finalSelection.finalNumbers,
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
    windowSizes: getDefaultEvaluationWindowSizes({ maxWindowSize: ACCUMULATED_EXTENDED_WINDOW_MAX }),
    strategyKeys: ACCUMULATED_FOCUS_STRATEGY_KEYS,
  });

  return buildAccumulatedStrategySelectionFromAggregates(rangeRowsSortedAsc, aggregates);
}
