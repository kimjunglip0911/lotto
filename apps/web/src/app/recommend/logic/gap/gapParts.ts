/**
 * 추천 간격 순위 계산에 필요한 작은 부품입니다.
 *
 * 하는 일
 * - 기준 회차 앞의 당첨 이력을 번호별 출현 회차로 묶습니다.
 * - 연속 출현 묶음을 접어 평균 간격 계산에 쓸 숫자 목록을 만듭니다.
 *
 * 역할 나눔
 * - `gapRank.ts`는 이 부품을 이용해 최종 순위만 매깁니다.
 */

import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { toMainNumbersOnly } from '@/lib/accu-nums/logic/numCounts';

export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;

export const avgGap = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

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
    for (const num of toMainNumbersOnly(row)) {
      if (num >= LOTTO_MIN && num <= LOTTO_MAX) buckets[num]!.push(row.draw_no);
    }
  }
  return buckets;
};
