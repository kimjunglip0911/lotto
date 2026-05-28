import { describe, expect, it } from 'vitest';

import { getRank } from '../logic/rank';

describe('getRank', () => {
  it('6개 일치면 1등을 반환한다', () => {
    expect(getRank(6, false)).toBe(1);
  });

  it('5개+보너스 일치면 2등을 반환한다', () => {
    expect(getRank(5, true)).toBe(2);
  });

  it('5개 일치(보너스 미일치)면 3등을 반환한다', () => {
    expect(getRank(5, false)).toBe(3);
  });

  it('4개 일치면 4등을 반환한다', () => {
    expect(getRank(4, false)).toBe(4);
  });

  it('3개 일치면 5등을 반환한다', () => {
    expect(getRank(3, false)).toBe(5);
  });

  it('3개 미만 일치면 null을 반환한다', () => {
    expect(getRank(2, false)).toBeNull();
  });
});
