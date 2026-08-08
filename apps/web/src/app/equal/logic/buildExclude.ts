import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { freqGeTwo } from './freqGeTwo';

/** 2회 이상 출현 ∪ 직전 회차 번호(중복 제거·오름차순). */
export const buildEqualExclude = (
  windowRows: readonly WinningNumberRow[],
  prevNums: readonly number[],
): number[] => {
  const merged = new Set<number>([...freqGeTwo(windowRows), ...prevNums]);
  return [...merged]
    .filter((n) => n >= 1 && n <= 45)
    .sort((a, b) => a - b);
};
