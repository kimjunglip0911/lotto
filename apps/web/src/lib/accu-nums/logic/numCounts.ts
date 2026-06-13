import { NUMBER_RANGE_MAX, createEmptyCounts } from '../constants';
import type { CountResult, WinningNumberRow } from '../types';
import { toMainNumbersOnly } from './numCountsRow';

export { isWinningNumberRow, toMainNumbersOnly } from './numCountsRow';

/** 선택 구간 내 번호별 출현 횟수(보너스 제외). */
export const buildNumberCounts = (rows: WinningNumberRow[]) => {
  const counts = createEmptyCounts();

  for (const row of rows) {
    for (const num of toMainNumbersOnly(row)) {
      if (num >= 1 && num <= NUMBER_RANGE_MAX) {
        counts[num - 1] += 1;
      }
    }
  }

  return counts;
};

export const toSelectedMainNumbers = (row: WinningNumberRow | null) =>
  row ? toMainNumbersOnly(row) : [];

export const toSelectedHighlightNumbers = (row: WinningNumberRow | null) => {
  if (!row) {
    return null;
  }

  return new Set([...toSelectedMainNumbers(row), row.bonus_num]);
};

export const createEmptyCountResult = (): CountResult => ({
  counts: createEmptyCounts(),
  analyzedDrawCount: 0,
});

export const toCountResult = (rows: WinningNumberRow[]): CountResult => ({
  counts: buildNumberCounts(rows),
  analyzedDrawCount: rows.length,
});
