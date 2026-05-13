/** apply 액션만 따로 처리해 accSrchRed 본문 길이를 줄인다. */

import type { AccSearchOut } from './runAccSearch';
import { createEmptyCountResult } from './numCounts';
import type { AccSrchSt } from './accSrchStDef';

export const emptyAccDerived = (): Pick<AccSrchSt, 'allTimeCountResult' | 'accumulatedCountExclusion'> => ({
  allTimeCountResult: createEmptyCountResult(),
  accumulatedCountExclusion: null,
});

export const accSrchApplyOut = (s: AccSrchSt, out: AccSearchOut): AccSrchSt => {
  if (out.kind === 'draw1') {
    return { ...s, selectedWinningNumber: out.winningNumber, ...emptyAccDerived() };
  }
  return {
    ...s,
    allTimeCountResult: out.allTimeCountResult,
    selectedWinningNumber: out.winningNumber,
    accumulatedCountExclusion: out.accumulatedCountExclusion,
  };
};
