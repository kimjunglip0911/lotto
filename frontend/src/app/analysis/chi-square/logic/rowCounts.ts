import { TOTAL_NUMBERS } from '../constants';
import type { WinningNumberRow } from '../types';

export const addRowToCounts = (row: WinningNumberRow, counts: number[]): void => {
  const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
  for (const num of nums) {
    if (num >= 1 && num <= TOTAL_NUMBERS) {
      counts[num - 1] += 1;
    }
  }
};

export const mainSix = (row: WinningNumberRow): readonly [number, number, number, number, number, number] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

export const hitsSet = (main: readonly number[], picked: readonly number[]): boolean => {
  const s = new Set(picked);
  return main.some((n) => s.has(n));
};
