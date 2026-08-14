import { describe, expect, it } from 'vitest';
import { nextSixCombo } from '@/app/recommend/logic/combo/nextSix';
import { setKey } from '@/app/recommend/logic/combo/toSet';

describe('nextSixCombo', () => {
  it('막힌 첫 조합을 건너뛰고 다음 6개를 고른다', () => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8];
    const blocked = new Set([setKey([1, 2, 3, 4, 5, 6])]);
    expect(nextSixCombo(nums, blocked)).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it('번호가 6개 미만이면 null이다', () => {
    expect(nextSixCombo([1, 2, 3, 4, 5], new Set())).toBeNull();
  });
});
