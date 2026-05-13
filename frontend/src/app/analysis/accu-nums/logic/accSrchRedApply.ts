/** apply 액션만 따로 처리해 accSrchRed 본문 길이를 줄인다. */

import type { AccSearchOut } from './runAccSearch';
import { createEmptyCountResult, createEmptyWindowCountMap } from './numCounts';
import type { AccSrchSt } from './accSrchStDef';

export const emptyAccDerived = (): Pick<
  AccSrchSt,
  | 'allTimeCountResult'
  | 'windowCountResultMap'
  | 'strategyCharts'
  | 'finalNumberPlan'
  | 'accumulatedCountExclusion'
> => ({
  allTimeCountResult: createEmptyCountResult(),
  windowCountResultMap: createEmptyWindowCountMap(),
  strategyCharts: [],
  finalNumberPlan: null,
  accumulatedCountExclusion: null,
});

export const accSrchApplyOut = (s: AccSrchSt, out: AccSearchOut): AccSrchSt => {
  if (out.kind === 'draw1') {
    return { ...s, selectedWinningNumber: out.winningNumber, ...emptyAccDerived() };
  }
  return {
    ...s,
    allTimeCountResult: out.allTimeCountResult,
    windowCountResultMap: out.windowCountResultMap,
    selectedWinningNumber: out.winningNumber,
    accumulatedCountExclusion: out.accumulatedCountExclusion,
    strategyCharts: out.strategyCharts,
    finalNumberPlan: out.finalNumberPlan,
  };
};
