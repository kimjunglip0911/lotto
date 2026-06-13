import type { WinningNumberRow } from '../types';

const MAIN_NUMBER_KEYS = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6'] as const;

/** 본번호 6개만(보너스 제외). */
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
