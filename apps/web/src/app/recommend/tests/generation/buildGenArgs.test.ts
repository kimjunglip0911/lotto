import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGenArgs } from '@/app/recommend/logic/generation/buildGenArgs';

const mk = (
  draw_no: number,
  nums: [number, number, number, number, number, number],
  bonus_num: number,
): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num,
});

describe('buildGenArgs exclude', () => {
  it('2회 이상과 직전 7개를 제외하고 풀에서 뺀다', () => {
    const history = [
      mk(1, [1, 2, 3, 4, 5, 6], 7),
      mk(2, [1, 8, 9, 10, 11, 12], 7),
    ];
    const { excludedNumbers, numberPool } = buildGenArgs(history, 3);
    expect(excludedNumbers).toEqual([1, 7, 8, 9, 10, 11, 12]);
    for (const n of excludedNumbers) {
      expect(numberPool.includes(n)).toBe(false);
    }
  });
});

describe('buildGenArgs gap window', () => {
  it('간격 이력과 자리대는 모두 3년 156회다', () => {
    const history = Array.from({ length: 160 }, (_, i) =>
      mk(i + 1, [1, 2, 3, 4, 5, 6], 7),
    );
    const args = buildGenArgs(history, 161);
    expect(args.gapHistory).toHaveLength(156);
    expect(args.bandWindowHistories[0]).toHaveLength(156);
  });
});
