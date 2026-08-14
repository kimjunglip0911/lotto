/** 번호별 출현 회차와 연속 묶음 간격을 만듭니다. */

import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { numsForGapDraw } from '@/app/recommend/logic/gap/numsForGap';

export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;

export const avgGap = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

export const maxGapOf = (values: readonly number[]): number | null =>
  values.length === 0 ? null : Math.max(...values);

/** 현재가 더 길면 최대를 그 값으로 갱신합니다. */
export const mergeMaxGap = (closedMax: number | null, current: number | null): number | null =>
  closedMax === null ? current : current === null ? closedMax : Math.max(closedMax, current);

export const buildGaps = (draws: readonly number[]): number[] => {
  const result: number[] = [];
  let base = draws[0];
  for (let index = 1; index < draws.length; index++) {
    const current = draws[index]!;
    if (current === base + 1) {
      base = current;
      continue;
    }
    result.push(current - base);
    base = current;
  }
  return result;
};

export const collectNumberDraws = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): number[][] => {
  const buckets = Array.from({ length: LOTTO_MAX + 1 }, () => [] as number[]);
  for (const row of rows) {
    if (row.draw_no >= referenceDrawNo) continue;
    for (const num of numsForGapDraw(row)) {
      buckets[num]!.push(row.draw_no);
    }
  }
  return buckets;
};
