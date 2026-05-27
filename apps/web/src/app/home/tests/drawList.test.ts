import { describe, expect, it } from 'vitest';

import { toAvailableDraws } from '../helpers/drawList';

describe('toAvailableDraws', () => {
  it('빈 배열이면 빈 목록을 반환한다', () => {
    expect(toAvailableDraws([])).toEqual([]);
  });

  it('첫 회차+1을 맨 앞에 붙인다', () => {
    expect(toAvailableDraws([999, 998, 997])).toEqual([1000, 999, 998, 997]);
  });
});
