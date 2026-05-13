/** 선택 회차로 API를 부르고, 1회차면 당첨만·그 외면 누적·윈도·전략까지 한 번에 계산해 돌려준다. */

import {
  fetchWinningNumberByDraw,
  fetchWinningNumbersRange,
  fetchWinningNumbersWindow,
} from '../api';
import { WINDOW_CONFIGS } from '../constants';
import { buildAccumulatedCountExclusionResult, type AccumulatedCountExclusionResult } from './accuCntExt';
import { buildWindowCountResultMap, toCountResult } from './numCounts';
import { runAccumulatedStrategySelection } from './runStratSel';
import type {
  CountResult,
  FinalNumberPlan,
  StrategyChartData,
  WinningNumberRow,
  WindowCountResultMap,
} from '../types';

export type AccSearchDraw1 = { kind: 'draw1'; winningNumber: WinningNumberRow };

export type AccSearchFull = {
  kind: 'full';
  winningNumber: WinningNumberRow;
  allTimeCountResult: CountResult;
  windowCountResultMap: WindowCountResultMap;
  accumulatedCountExclusion: AccumulatedCountExclusionResult;
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};

export type AccSearchOut = AccSearchDraw1 | AccSearchFull;

export async function runAccSearch(selectedDrawNo: number): Promise<AccSearchOut> {
  if (selectedDrawNo === 1) {
    const winningNumber = await fetchWinningNumberByDraw(selectedDrawNo);
    return { kind: 'draw1', winningNumber };
  }

  const [rangeRows, winningNumber, ...windowRows] = await Promise.all([
    fetchWinningNumbersRange(selectedDrawNo),
    fetchWinningNumberByDraw(selectedDrawNo),
    ...WINDOW_CONFIGS.map((c) => fetchWinningNumbersWindow(selectedDrawNo, c.windowSize)),
  ]);

  const { strategyCharts, finalNumberPlan } = runAccumulatedStrategySelection(rangeRows);

  return {
    kind: 'full',
    winningNumber,
    allTimeCountResult: toCountResult(rangeRows),
    windowCountResultMap: buildWindowCountResultMap(windowRows),
    accumulatedCountExclusion: buildAccumulatedCountExclusionResult(rangeRows),
    strategyCharts,
    finalNumberPlan,
  };
}
