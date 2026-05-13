import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import { buildAccumulatedCountExclusionResult } from '../logic/accumulatedCountExtremes';

const row = (drawNo: number, nums: [number, number, number, number, number, number]): WinningNumberRow => ({
  draw_no: drawNo,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

describe('buildAccumulatedCountExclusionResult', () => {
  it('행이 없으면 빈 결과를 반환한다', () => {
    expect(buildAccumulatedCountExclusionResult([]).excludedUnique).toEqual([]);
  });

  it('최다는 동률 시 가장 작은 번호, 최소는 최소 출현 횟수인 번호들 중 가장 작은 번호다', () => {
    const rows: WinningNumberRow[] = [
      row(1, [1, 2, 3, 4, 5, 6]),
      row(2, [7, 8, 9, 10, 11, 12]),
    ];
    const r = buildAccumulatedCountExclusionResult(rows);
    expect(r.twoYearHighest).toBe(1);
    expect(r.twoYearLowest).toBe(13);
    expect(r.allTimeHighest).toBe(1);
    expect(r.allTimeLowest).toBe(13);
    expect(r.excludedUnique).toEqual([1, 13]);
  });

  it('한 회차만 있을 때 최다는 1~6 중 최소 번호, 최소는 미출현 중 최소 번호다', () => {
    const rows: WinningNumberRow[] = [row(1, [1, 2, 3, 4, 5, 6])];
    const r = buildAccumulatedCountExclusionResult(rows);
    expect(r.twoYearHighest).toBe(1);
    expect(r.twoYearLowest).toBe(7);
    expect(r.excludedUnique).toEqual([1, 7]);
  });
});
