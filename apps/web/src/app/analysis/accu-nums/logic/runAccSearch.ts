/** 선택 회차로 API를 부르고, 1회차면 당첨만·그 외면 누적 집계와 극값 제외를 한 번에 계산해 돌려준다. */

import { fetchWinningNumberByDraw, fetchWinningNumbersRange } from '../api';
import { buildAccumulatedCountExclusionResult, type AccumulatedCountExclusionResult } from './accuCntExt';
import { toCountResult } from './numCounts';
import type { CountResult, WinningNumberRow } from '../types';

export type AccSearchDraw1 = { kind: 'draw1'; winningNumber: WinningNumberRow };

export type AccSearchFull = {
  kind: 'full';
  winningNumber: WinningNumberRow;
  allTimeCountResult: CountResult;
  accumulatedCountExclusion: AccumulatedCountExclusionResult;
};

export type AccSearchOut = AccSearchDraw1 | AccSearchFull;

export async function runAccSearch(selectedDrawNo: number): Promise<AccSearchOut> {
  if (selectedDrawNo === 1) {
    const winningNumber = await fetchWinningNumberByDraw(selectedDrawNo);
    return { kind: 'draw1', winningNumber };
  }

  const [rangeRows, winningNumber] = await Promise.all([
    fetchWinningNumbersRange(selectedDrawNo),
    fetchWinningNumberByDraw(selectedDrawNo),
  ]);

  return {
    kind: 'full',
    winningNumber,
    allTimeCountResult: toCountResult(rangeRows),
    accumulatedCountExclusion: buildAccumulatedCountExclusionResult(rangeRows),
  };
}
