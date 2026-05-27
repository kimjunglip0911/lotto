import type { WinningNumberRow } from '../../types/winRow';

export const testWinRow = (
  drawNo: number,
  nums: [number, number, number, number, number, number],
): WinningNumberRow => ({
  draw_no: drawNo,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

export const createTestRows = (count: number): WinningNumberRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const drawNo = idx + 1;
    return testWinRow(drawNo, [
      ((drawNo + 0) % 45) + 1,
      ((drawNo + 7) % 45) + 1,
      ((drawNo + 14) % 45) + 1,
      ((drawNo + 21) % 45) + 1,
      ((drawNo + 28) % 45) + 1,
      ((drawNo + 35) % 45) + 1,
    ]);
  });
