import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRows } from '../logic/buildGapRows';

const draw = (
  draw_no: number,
  nums: number[],
  bonus_num = 45,
): WinningNumberRow => ({
  draw_no,
  num1: nums[0] ?? 1,
  num2: nums[1] ?? 2,
  num3: nums[2] ?? 3,
  num4: nums[3] ?? 4,
  num5: nums[4] ?? 5,
  num6: nums[5] ?? 6,
  bonus_num,
});

describe('buildGapRows', () => {
  it('표 행은 순위·번호·미추첨 기간·최대만 가진다', () => {
    const stat = buildGapRows([draw(1, [7]), draw(10, [7])]).find(
      (row) => row.number === 7,
    );
    expect(Object.keys(stat ?? {}).sort()).toEqual(['currentGap', 'maxGap', 'number', 'rank']);
    expect(stat?.maxGap).toBe(9);
    expect(stat?.currentGap).toBe(1);
  });

  it('보너스만 나온 번호도 집계한다', () => {
    const stat = buildGapRows([
      draw(1, [1, 2, 3, 4, 5, 6], 20),
      draw(5, [1, 2, 3, 4, 5, 6], 20),
    ]).find((row) => row.number === 20);
    expect(stat?.maxGap).toBe(4);
    expect(stat?.currentGap).toBe(1);
  });

  it('연속 출현은 묶음 끝에서 다음까지 최대를 계산한다', () => {
    const stat = buildGapRows([
      draw(10, [12]),
      draw(11, [12]),
      draw(12, [12]),
      draw(20, [12]),
    ]).find((row) => row.number === 12);
    expect(stat?.maxGap).toBe(8);
  });

  it('현재 미추첨 기간이 더 길면 최대를 그 값으로 갱신한다', () => {
    const stat = buildGapRows([draw(1, [7]), draw(4, [7]), draw(20, [9])]).find(
      (row) => row.number === 7,
    );
    expect(stat?.currentGap).toBe(17);
    expect(stat?.maxGap).toBe(17);
  });
});
