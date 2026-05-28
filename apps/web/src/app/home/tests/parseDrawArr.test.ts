import { describe, expect, it } from 'vitest';

import { parseDrawNumArr } from '../logic/parseDrawArr';

describe('parseDrawNumArr', () => {
  it('배열이 아니면 null을 반환한다', () => {
    expect(parseDrawNumArr(null)).toBeNull();
    expect(parseDrawNumArr({})).toBeNull();
  });

  it('정수 회차만 남긴다', () => {
    expect(parseDrawNumArr([999, 'x', 998, 1.5])).toEqual([999, 998]);
  });

  it('정수가 없으면 null을 반환한다', () => {
    expect(parseDrawNumArr(['a', 1.5])).toBeNull();
  });
});
