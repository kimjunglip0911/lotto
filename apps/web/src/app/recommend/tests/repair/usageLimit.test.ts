import { describe, expect, it } from 'vitest';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import {
  canUseNum,
  filterUsageAvail,
  isSetWithinUsageLimit,
} from '@/app/recommend/logic/repair/usageLimit';

describe('usageLimit helpers (3회 한도 임시 비활성)', () => {
  it('canUseNum: 한도 도달 번호도 사용 가능', () => {
    const usage = new Map<number, number>([
      [1, 0],
      [2, 2],
      [3, 3],
    ]);
    expect(canUseNum(1, usage)).toBe(true);
    expect(canUseNum(2, usage)).toBe(true);
    expect(canUseNum(3, usage)).toBe(true);
  });

  it('canUseNum: usage Map 없으면 항상 가능', () => {
    expect(canUseNum(7, undefined)).toBe(true);
  });

  it('filterUsageAvail: 한도 도달 번호도 제외하지 않는다', () => {
    const usage = new Map<number, number>([
      [1, 3],
      [2, 1],
      [3, 0],
    ]);
    expect(filterUsageAvail([1, 2, 3, 4], usage)).toEqual([1, 2, 3, 4]);
  });

  it('isSetWithinUsageLimit: 한도 초과 번호가 있어도 통과', () => {
    const usage = new Map<number, number>([
      [1, 0],
      [2, 3],
      [3, 0],
    ]);
    expect(isSetWithinUsageLimit([3, 5, 7, 9, 11, 13], usage)).toBe(true);
    expect(isSetWithinUsageLimit([1, 2, 3, 4, 5, 6], usage)).toBe(true);
  });

  it('MAX_NUM_USAGE 상수는 3으로 유지(재활성화용)', () => {
    expect(MAX_NUM_USAGE).toBe(3);
  });
});
