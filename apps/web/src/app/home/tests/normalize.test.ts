import { describe, expect, it } from 'vitest';

import { canCalcWins, toNumOrNull, toWinNums } from '../logic/normalize';

describe('toNumOrNull', () => {
  it('빈 문자열이면 null을 반환한다', () => {
    expect(toNumOrNull('')).toBeNull();
  });

  it('숫자 입력이면 그대로 반환한다', () => {
    expect(toNumOrNull(7)).toBe(7);
  });

  it('NaN 숫자 값이면 null을 반환한다', () => {
    expect(toNumOrNull(Number.NaN)).toBeNull();
  });
});

describe('toWinNums', () => {
  it('빈 칸이 있으면 6개 미만 배열을 반환한다', () => {
    expect(toWinNums(['', 2, 3, 4, 5, 6])).toEqual([2, 3, 4, 5, 6]);
  });

  it('6칸이 모두 숫자이면 6개 배열을 반환한다', () => {
    expect(toWinNums([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('canCalcWins', () => {
  it('6개가 아니면 false이다', () => {
    expect(canCalcWins([1, 2, 3, 4, 5])).toBe(false);
  });

  it('0이 포함되면 false이다', () => {
    expect(canCalcWins([1, 2, 3, 4, 5, 0])).toBe(false);
  });

  it('6개이고 0이 없으면 true이다', () => {
    expect(canCalcWins([1, 2, 3, 4, 5, 6])).toBe(true);
  });
});
