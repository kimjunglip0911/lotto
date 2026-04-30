import { NUMBER_RANGE_MAX, WINDOW_CONFIGS, createEmptyCounts } from '../constants';
import type { CountResult, WinningNumberRow, WindowCountResultMap } from '../types';

const MAIN_NUMBER_KEYS = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6'] as const;

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

const toMainNumbers = (row: WinningNumberRow) => MAIN_NUMBER_KEYS.map((key) => row[key]);

const toAllWinningNumbers = (row: WinningNumberRow) => [...toMainNumbers(row), row.bonus_num];

export const buildNumberCounts = (rows: WinningNumberRow[]) => {
  const counts = createEmptyCounts();

  for (const row of rows) {
    for (const num of toAllWinningNumbers(row)) {
      if (num >= 1 && num <= NUMBER_RANGE_MAX) {
        counts[num - 1] += 1;
      }
    }
  }

  return counts;
};

export const toSelectedMainNumbers = (row: WinningNumberRow | null) =>
  row ? toMainNumbers(row) : [];

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

/** WINDOW_CONFIGS 순서대로 빈 집계 맵을 만든다. */
export const createEmptyWindowCountMap = (): WindowCountResultMap =>
  Object.fromEntries(WINDOW_CONFIGS.map((config) => [config.key, createEmptyCountResult()])) as WindowCountResultMap;

export const toCountResult = (rows: WinningNumberRow[]): CountResult => ({
  counts: buildNumberCounts(rows),
  analyzedDrawCount: rows.length,
});

/** 윈도우별 당첨 행 배열을 WINDOW_CONFIGS 순서와 매칭해 집계 맵으로 만든다. */
export const buildWindowCountResultMap = (windowRows: WinningNumberRow[][]): WindowCountResultMap =>
  Object.fromEntries(
    WINDOW_CONFIGS.map((config, index) => {
      const rows = windowRows[index] ?? [];
      return [config.key, toCountResult(rows)];
    })
  ) as WindowCountResultMap;
