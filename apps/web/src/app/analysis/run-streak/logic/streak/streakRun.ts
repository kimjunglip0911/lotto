import type { WinningNumberRow } from '../../types';
import { isValidLotteryNumber } from '../../constants/lotNums';
import { getMainNumbers } from '../consec';

export const mainSet = (row: WinningNumberRow): Set<number> =>
  new Set(getMainNumbers(row).filter(isValidLotteryNumber));

export const countRunFromPrevDraw = (
  drawByNo: Map<number, WinningNumberRow>,
  selectedDrawNo: number,
  n: number,
): { rawRunLen: number; segmentStart: number | null } => {
  let rawRunLen = 0;
  let segmentStart: number | null = null;
  for (let d = selectedDrawNo - 1; d >= 1; d -= 1) {
    const row = drawByNo.get(d);
    if (!row) break;
    if (!mainSet(row).has(n)) break;
    rawRunLen += 1;
    segmentStart = d;
  }
  return { rawRunLen, segmentStart };
};
