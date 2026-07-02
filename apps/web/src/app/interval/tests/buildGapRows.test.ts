import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRows } from '../logic/buildGapRows';

const draw = (draw_no: number, nums: number[]): WinningNumberRow => ({
  draw_no,
  num1: nums[0] ?? 1,
  num2: nums[1] ?? 2,
  num3: nums[2] ?? 3,
  num4: nums[3] ?? 4,
  num5: nums[4] ?? 5,
  num6: nums[5] ?? 6,
  bonus_num: 45,
});

describe('buildGapRows', () => {
  it('일반 출현 간격의 평균 최대를 계산한다', () => {
    const rows = [draw(1, [7]), draw(4, [7]), draw(10, [7])];
    const stat = buildGapRows(rows).find((row) => row.number === 7);

    expect(stat?.draws).toEqual([1, 4, 10]);
    expect(stat?.gaps).toEqual([3, 6]);
    expect(Object.keys(stat ?? {})).toEqual(['number', 'draws', 'gaps', 'avgGap', 'maxGap']);
    expect(stat?.avgGap).toBe(5);
    expect(stat?.maxGap).toBe(6);
  });

  it('3회 이상 연속 출현하면 마지막 연속 회차부터 다음 출현까지 계산한다', () => {
    const rows = [draw(10, [12]), draw(11, [12]), draw(12, [12]), draw(20, [12])];
    const stat = buildGapRows(rows).find((row) => row.number === 12);

    expect(stat?.draws).toEqual([10, 11, 12, 20]);
    expect(stat?.gaps).toEqual([8]);
    expect(stat?.avgGap).toBe(8);
    expect(stat?.maxGap).toBe(8);
  });

  it('다음 출현까지의 간격이 없으면 통계를 비워 둔다', () => {
    const stat = buildGapRows([draw(5, [30])]).find((row) => row.number === 30);

    expect(stat?.draws).toEqual([5]);
    expect(stat?.gaps).toEqual([]);
    expect(stat?.avgGap).toBeNull();
    expect(stat?.maxGap).toBeNull();
  });
});
