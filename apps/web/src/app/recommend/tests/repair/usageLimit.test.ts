import { describe, expect, it } from 'vitest';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import {
  canUseNum,
  filterUsageAvail,
  isSetWithinUsageLimit,
} from '@/app/recommend/logic/repair/usageLimit';

describe('usageLimit helpers', () => {
  it('canUseNum: usage 미만이면 사용 가능', () => {
    const usage = new Map<number, number>([
      [1, 0],
      [2, 2],
      [3, 3],
    ]);
    expect(canUseNum(1, usage)).toBe(true);
    expect(canUseNum(2, usage)).toBe(true);
    expect(canUseNum(3, usage)).toBe(false);
  });

  it('canUseNum: usage Map 없으면 항상 가능', () => {
    expect(canUseNum(7, undefined)).toBe(true);
  });

  it('filterUsageAvail: 한도 도달 번호 제외', () => {
    const usage = new Map<number, number>([
      [1, 3],
      [2, 1],
      [3, 0],
    ]);
    expect(filterUsageAvail([1, 2, 3, 4], usage)).toEqual([2, 3, 4]);
  });

  it('isSetWithinUsageLimit: 6개 모두 사용 가능해야 통과', () => {
    const usage = new Map<number, number>([
      [1, 0],
      [2, 3],
      [3, 0],
    ]);
    expect(isSetWithinUsageLimit([3, 5, 7, 9, 11, 13], usage)).toBe(true);
    expect(isSetWithinUsageLimit([1, 2, 3, 4, 5, 6], usage)).toBe(false);
  });

  it('MAX_NUM_USAGE는 3', () => {
    expect(MAX_NUM_USAGE).toBe(3);
  });
});
