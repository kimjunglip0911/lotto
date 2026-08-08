import type { WinningNumberRow } from '@/lib/accu-nums/types';
import type { EqualBuckets } from '../types/equal';
import { countWithBonus } from './countWithBonus';

/** 출현 횟수로 0·1·2·3회 이상 버킷을 만든다(오름차순). */
export const buildEqualBuckets = (
  rows: readonly WinningNumberRow[],
): EqualBuckets => {
  const counts = countWithBonus(rows);
  const zero: number[] = [];
  const one: number[] = [];
  const two: number[] = [];
  const threePlus: number[] = [];

  counts.forEach((count, index) => {
    const num = index + 1;
    if (count <= 0) zero.push(num);
    else if (count === 1) one.push(num);
    else if (count === 2) two.push(num);
    else threePlus.push(num);
  });

  return { zero, one, two, threePlus };
};
