import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';
import type { AccumulatedStrategyKey } from '../types/stratEval';
import type { AccumulatedStrategySelection, WinningNumberRow } from '../types';
import { runAccumulatedStrategyEvaluation } from './stratEval';
import { buildAccumulatedStrategySelectionFromAggregates } from './stratSelBuild';

export { buildAccumulatedStrategySelectionFromAggregates } from './stratSelBuild';
export type { AccumulatedStrategySelection } from '../types';

/** 누적 화면 전략: 직전 104회·전체 각각 상위4·하위4만 평가한다. */
const ACCUMULATED_UI_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = [
  'top4Frequency',
  'bottom4Frequency',
];

/** 선택 회차 이전 당첨 행으로 전략 차트·극값 제외 번호를 계산한다. */
export const runAccumulatedStrategySelection = (
  rangeRowsSortedAsc: WinningNumberRow[],
): AccumulatedStrategySelection => {
  const drawNumbersToEvaluate = rangeRowsSortedAsc.map((r) => r.draw_no).filter((d) => d >= 100);
  if (drawNumbersToEvaluate.length === 0) {
    return { strategyCharts: [], finalNumberPlan: null };
  }

  const fullWindowSize = rangeRowsSortedAsc.length;
  const windowSizes = [...new Set([ACCUMULATED_STRATEGY_WINDOW_DRAWS, fullWindowSize])].sort(
    (a, b) => a - b,
  );

  const { aggregates } = runAccumulatedStrategyEvaluation({
    allRowsSortedAsc: rangeRowsSortedAsc,
    drawNumbersToEvaluate,
    windowSizes,
    strategyKeys: ACCUMULATED_UI_STRATEGY_KEYS,
  });

  return buildAccumulatedStrategySelectionFromAggregates(rangeRowsSortedAsc, aggregates);
};
