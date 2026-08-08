import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import {
  findPrevDrawRow,
  numsFromDrawRow,
  poolWithoutNums,
} from '@/app/recommend/logic/generation/prevDrawExclude';

const mkRow = (
  drawNo: number,
  nums: [number, number, number, number, number, number],
  bonus: number,
): WinningNumberRow => ({
  draw_no: drawNo,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: bonus,
});

describe('prevDrawExclude', () => {
  it('기준 회차 직전 행을 고른다', () => {
    const rows = [mkRow(10, [1, 2, 3, 4, 5, 6], 7), mkRow(12, [8, 9, 10, 11, 12, 13], 14)];
    expect(findPrevDrawRow(rows, 13)?.draw_no).toBe(12);
    expect(findPrevDrawRow(rows, 11)?.draw_no).toBe(10);
    expect(findPrevDrawRow(rows, 10)).toBeNull();
  });

  it('본번호+보너스 7개를 정렬해 반환한다', () => {
    expect(numsFromDrawRow(mkRow(1, [10, 2, 3, 4, 5, 6], 10))).toEqual([2, 3, 4, 5, 6, 10]);
    expect(numsFromDrawRow(null)).toEqual([]);
  });

  it('제외 번호를 풀에서 뺀다', () => {
    const pool = poolWithoutNums([1, 45, 20]);
    expect(pool).toHaveLength(42);
    expect(pool.includes(1)).toBe(false);
    expect(pool.includes(20)).toBe(false);
    expect(pool.includes(45)).toBe(false);
  });
});
