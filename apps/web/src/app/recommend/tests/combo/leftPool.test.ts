import { describe, expect, it } from 'vitest';
import { METHOD_JL } from '@/app/recommend/constants/comboThresholds';
import {
  numsUsedInSlots,
  unusedFromPool,
} from '@/app/recommend/logic/combo/leftPool';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

const mk = (nums: [number, number, number, number, number, number]): GeneratedSet => ({
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  method: METHOD_JL,
});

describe('leftover pool', () => {
  it('슬롯에 나온 번호를 모은다', () => {
    const slots = [mk([1, 2, 3, 4, 5, 6]), null, mk([6, 7, 8, 9, 10, 11])];
    expect([...numsUsedInSlots(slots, 0, 3)].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('풀에서 미사용 번호만 남긴다', () => {
    const used = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(unusedFromPool([1, 2, 13, 14, 20], used)).toEqual([13, 14, 20]);
  });

  it('미사용이 6개 미만이면 빈 풀이 될 수 있다', () => {
    const used = new Set([1, 2, 3, 4, 5]);
    expect(unusedFromPool([1, 2, 3, 4, 5], used)).toEqual([]);
  });
});
