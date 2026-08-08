import type { WinningNumberRow } from '@/lib/accu-nums/types';

const NUMBER_KEYS = [
  'num1',
  'num2',
  'num3',
  'num4',
  'num5',
  'num6',
  'bonus_num',
] as const;

/** 주번호+보너스 출현 횟수(길이 45, 인덱스 0 = 번호 1). */
export const countWithBonus = (rows: readonly WinningNumberRow[]): number[] => {
  const counts = new Array<number>(45).fill(0);
  for (const row of rows) {
    for (const key of NUMBER_KEYS) {
      const value = row[key];
      if (typeof value === 'number' && value >= 1 && value <= 45) {
        counts[value - 1] += 1;
      }
    }
  }
  return counts;
};
