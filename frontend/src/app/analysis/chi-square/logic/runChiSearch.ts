import { fetchWinningNumberByDraw, fetchWinningNumbersRange } from '../api';
import { buildChiSquareResults } from './chiSquare';
import type { ChiSquareResult, WinningNumberRow } from '../types';

export type ChiSearchDraw1 = { kind: 'draw1'; winningNumber: WinningNumberRow };

export type ChiSearchFull = {
  kind: 'full';
  winningNumber: WinningNumberRow;
  analyzedDrawCount: number;
  chiSquareResults: ChiSquareResult[];
  walkForwardRows: readonly WinningNumberRow[];
};

export type ChiSearchOut = ChiSearchDraw1 | ChiSearchFull;

export async function runChiSearch(selectedDrawNo: number): Promise<ChiSearchOut> {
  if (selectedDrawNo === 1) {
    const winningNumber = await fetchWinningNumberByDraw(selectedDrawNo);
    return { kind: 'draw1', winningNumber };
  }
  const [winningNumber, rangeRows] = await Promise.all([
    fetchWinningNumberByDraw(selectedDrawNo),
    fetchWinningNumbersRange(selectedDrawNo),
  ]);
  const sortedRows = [...rangeRows].sort((a, b) => a.draw_no - b.draw_no);
  return {
    kind: 'full',
    winningNumber,
    analyzedDrawCount: rangeRows.length,
    chiSquareResults: buildChiSquareResults(rangeRows),
    walkForwardRows: sortedRows,
  };
}
