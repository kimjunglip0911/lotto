import { NUMBER_RANGE_MAX, WINDOW_CONFIGS, createEmptyCounts } from '../constants';
import type { CountResult, WinningNumberRow, WindowCountResultMap } from '../types';

const MAIN_NUMBER_KEYS = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6'] as const;

/** 본번호 6개만(보너스 제외). 적중 판정·누적 출현 집계 모두 동일 기준을 쓴다. */
export const toMainNumbersOnly = (row: WinningNumberRow): number[] =>
  MAIN_NUMBER_KEYS.map((key) => row[key]);

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

/** 선택 구간 내 번호별 출현 횟수 — 회차당 본번호 6개만 반영(보너스 제외). */
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
