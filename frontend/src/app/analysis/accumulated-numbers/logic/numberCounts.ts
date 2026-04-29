import { NUMBER_RANGE_MAX, createEmptyCounts } from '../constants';
import type { WinningNumberRow } from '../types';

export const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WinningNumberRow>;
  return (
    typeof candidate.draw_no === 'number' &&
    typeof candidate.num1 === 'number' &&
    typeof candidate.num2 === 'number' &&
    typeof candidate.num3 === 'number' &&
    typeof candidate.num4 === 'number' &&
    typeof candidate.num5 === 'number' &&
    typeof candidate.num6 === 'number' &&
    typeof candidate.bonus_num === 'number'
  );
};

export const buildNumberCounts = (rows: WinningNumberRow[]) => {
  const counts = createEmptyCounts();

  for (const row of rows) {
    const winningNumbers = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of winningNumbers) {
      if (num >= 1 && num <= NUMBER_RANGE_MAX) {
        counts[num - 1] += 1;
      }
    }
  }

  return counts;
};

export const toSelectedMainNumbers = (row: WinningNumberRow | null) =>
  row ? [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6] : [];

export const toSelectedHighlightNumbers = (row: WinningNumberRow | null) => {
  if (!row) {
    return null;
  }

  return new Set([...toSelectedMainNumbers(row), row.bonus_num]);
};

export const createEmptyCountResult = () => ({
  counts: createEmptyCounts(),
  analyzedDrawCount: 0,
});
