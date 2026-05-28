import { describe, expect, it } from 'vitest';

import { toInputNum } from '../logic/parseNum';

describe('toInputNum', () => {
  it('빈 문자열이면 빈 칸 값을 반환한다', () => {
    expect(toInputNum('')).toBe('');
  });

  it('숫자 문자열이면 정수를 반환한다', () => {
    expect(toInputNum('7')).toBe(7);
  });

  it('숫자가 아니면 빈 칸 값을 반환한다', () => {
    expect(toInputNum('abc')).toBe('');
  });

  it('공백만 있으면 빈 칸 값을 반환한다', () => {
    expect(toInputNum('  ')).toBe('');
  });

  it('앞부분만 숫자이면 앞의 정수를 반환한다', () => {
    expect(toInputNum('12a')).toBe(12);
  });
});
