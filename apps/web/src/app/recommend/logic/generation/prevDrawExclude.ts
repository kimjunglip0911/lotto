import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { toMainNumbersOnly } from '@/lib/accu-nums/logic/numCounts';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** 기준 회차 직전(가장 가까운 이전) 당첨 행 */

export const findPrevDrawRow = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): WinningNumberRow | null => {
  let best: WinningNumberRow | null = null;
  for (const row of rows) {
    if (row.draw_no >= referenceDrawNo) continue;
    if (!best || row.draw_no > best.draw_no) best = row;
  }
  return best;
};

/** 본번호 6 + 보너스 1 (1~45, 정렬·중복 제거) */

export const numsFromDrawRow = (row: WinningNumberRow | null): number[] => {
  if (!row) return [];
  return [...new Set([...toMainNumbersOnly(row), row.bonus_num])]
    .filter((n) => n >= 1 && n <= 45)
    .sort((a, b) => a - b);
};

/** 제외 번호를 뺀 추천 번호 풀 */

export const poolWithoutNums = (
  excluded: readonly number[],
  pool: readonly number[] = FULL_LOTTO_POOL,
): number[] => {
  if (excluded.length === 0) return [...pool];
  const ban = new Set(excluded);
  return pool.filter((n) => !ban.has(n));
};
