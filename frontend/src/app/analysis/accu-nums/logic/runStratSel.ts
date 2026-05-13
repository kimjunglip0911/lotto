import { buildStrategyRecommendation, runAccumulatedStrategyEvaluation, sliceWindowTail } from './stratEval';
import { buildAccumulatedCountExclusionResult } from './accuCntExt';
import { buildNumberCounts } from './numCounts';
import { toAtLeastOneRate, toAvgHits } from './stratCore/window/winRank';
import type { AccumulatedStrategyKey, StrategyWindowMetrics } from './stratCore/types';
import type { FinalNumberPlan, StrategyChartData, StrategyNumberPick, WinningNumberRow } from '../types';
import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';

/** 누적 화면 전략: 직전 104회·전체 각각 상위4·하위4만 평가한다. */
const ACCUMULATED_UI_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = ['top4Frequency', 'bottom4Frequency'];

export type AccumulatedStrategySelection = {
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};

function buildStrategy104Chart(
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregate: StrategyWindowMetrics,
  strategy: AccumulatedStrategyKey,
  strategyLabel: string,
  bandLabel: string
): StrategyChartData {
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
}

function findAgg(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  windowSize: number
): StrategyWindowMetrics | undefined {
  return aggregates.find((a) => a.strategy === strategy && a.windowSize === windowSize);
}

/**
 * 이미 계산된 전략·윈도 지표로 전략 차트·누적 극값 제외 번호를 만든다(스냅샷 일괄 등 증분 평가와 조합).
 * — 104회차 차트 2개는 2년 구간 상·하 표시용, `finalNumbers`는 통합 분석과 동일한 `buildAccumulatedCountExclusionResult`(2년·전체 각 최다·최소)의 고유 목록이다.
 */
export function buildAccumulatedStrategySelectionFromAggregates(
  rangeRowsSortedAsc: WinningNumberRow[],
  aggregates: StrategyWindowMetrics[]
): AccumulatedStrategySelection {
  const fullWindowSize = rangeRowsSortedAsc.length;
  const twoYearSize = ACCUMULATED_STRATEGY_WINDOW_DRAWS;

  const aggTop2y = findAgg(aggregates, 'top4Frequency', twoYearSize);
  const aggBot2y = findAgg(aggregates, 'bottom4Frequency', twoYearSize);
  const aggTopFull = findAgg(aggregates, 'top4Frequency', fullWindowSize);
  const aggBotFull = findAgg(aggregates, 'bottom4Frequency', fullWindowSize);

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
  const finalNumbers = [...excludedUnique];

  const strategyPicks: StrategyNumberPick[] = [
    {
      strategyKey: 'top4TwoYear',
      strategyLabel: '상위 출현 4 (2년, 104회차)',
      windowSizes: [twoYearSize],
      numbers: recTop2y.numbers,
      atLeastOneRate: recTop2y.metrics.atLeastOneRate,
      avgHits: recTop2y.metrics.avgHits,
      maxMissStreak: recTop2y.metrics.maxMissStreak,
    },
    {
      strategyKey: 'bottom4TwoYear',
      strategyLabel: '하위 출현 4 (2년, 104회차)',
      windowSizes: [twoYearSize],
      numbers: recBot2y.numbers,
      atLeastOneRate: recBot2y.metrics.atLeastOneRate,
      avgHits: recBot2y.metrics.avgHits,
      maxMissStreak: recBot2y.metrics.maxMissStreak,
    },
    {
      strategyKey: 'top4Full',
      strategyLabel: '상위 출현 4 (전체 기간)',
      windowSizes: [fullWindowSize],
      numbers: recTopFull.numbers,
      atLeastOneRate: recTopFull.metrics.atLeastOneRate,
      avgHits: recTopFull.metrics.avgHits,
      maxMissStreak: recTopFull.metrics.maxMissStreak,
    },
    {
      strategyKey: 'bottom4Full',
      strategyLabel: '하위 출현 4 (전체 기간)',
      windowSizes: [fullWindowSize],
      numbers: recBotFull.numbers,
      atLeastOneRate: recBotFull.metrics.atLeastOneRate,
      avgHits: recBotFull.metrics.avgHits,
      maxMissStreak: recBotFull.metrics.maxMissStreak,
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
 * 선택 회차 기준 이전 당첨 행만으로 전략 차트·통합과 동일한 누적 극값 제외 번호를 계산한다.
 * `draw_no < anchor` 구간이 오름차순으로 정렬된 배열을 넘긴다.
 */
export function runAccumulatedStrategySelection(
  rangeRowsSortedAsc: WinningNumberRow[]
): AccumulatedStrategySelection {
  const drawNumbersToEvaluate = rangeRowsSortedAsc.map((r) => r.draw_no).filter((d) => d >= 100);
  if (drawNumbersToEvaluate.length === 0) {
    return { strategyCharts: [], finalNumberPlan: null };
  }

  const fullWindowSize = rangeRowsSortedAsc.length;
  const windowSizes = [...new Set([ACCUMULATED_STRATEGY_WINDOW_DRAWS, fullWindowSize])].sort((a, b) => a - b);

  const { aggregates } = runAccumulatedStrategyEvaluation({
    allRowsSortedAsc: rangeRowsSortedAsc,
    drawNumbersToEvaluate,
    windowSizes,
    strategyKeys: ACCUMULATED_UI_STRATEGY_KEYS,
  });

  return buildAccumulatedStrategySelectionFromAggregates(rangeRowsSortedAsc, aggregates);
}
