import { NUMBER_RANGE_MAX, createEmptyCounts } from '../constants';
import type { CountResult, WinningNumberRow } from '../types';

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

export const toCountResult = (rows: WinningNumberRow[]): CountResult => ({
  counts: buildNumberCounts(rows),
  analyzedDrawCount: rows.length,
});
