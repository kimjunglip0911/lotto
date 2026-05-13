import type { WinningNumberRow } from '../../types';
import { getMainNumbers } from './consec';
import { isValidLotteryNumber } from './lotNums';

// 선택 회차 직전 회차부터 거꾸로 따라가며, 한 번호가 본번호 6개에 몇 회 연속 들어 있었는지 세는 데만 쓰입니다.

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
