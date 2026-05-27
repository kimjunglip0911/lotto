import type { WinningNumberRow } from '../types';

export const mainNumsOf = (row: WinningNumberRow): number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

export const winNumSet = (row: WinningNumberRow | null): Set<number> | null => {
  if (!row) return null;
  return new Set([...mainNumsOf(row), row.bonus_num]);
};
