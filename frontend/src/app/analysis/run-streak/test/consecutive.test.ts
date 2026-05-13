import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import { getConsecutivelyAppearedMainNumbers } from '../logic/consecutive';

/** 테스트용 당첨 행 — 보너스는 제외 로직에서 사용하지 않으나 스키마상 필수. */
function makeRow(
  draw_no: number,
  main: [number, number, number, number, number, number],
  bonus_num = 1,
): WinningNumberRow {
  return {
    draw_no,
    num1: main[0],
    num2: main[1],
    num3: main[2],
    num4: main[3],
    num5: main[4],
    num6: main[5],
    bonus_num,
  };
}

describe('getConsecutivelyAppearedMainNumbers', () => {
  it('N < 3이면 빈 배열', () => {
    expect(getConsecutivelyAppearedMainNumbers([], 1)).toEqual([]);
    expect(getConsecutivelyAppearedMainNumbers([], 2)).toEqual([]);
  });

  it('(N-2)와 (N-1) 본번호 교집합을 정렬해 반환', () => {
    const rows = [makeRow(2, [1, 3, 5, 7, 9, 11]), makeRow(3, [1, 2, 3, 4, 5, 6])];
    expect(getConsecutivelyAppearedMainNumbers(rows, 4)).toEqual([1, 3, 5]);
  });

  it('직전 두 회차 행이 없으면 빈 배열', () => {
    expect(getConsecutivelyAppearedMainNumbers([makeRow(1, [1, 2, 3, 4, 5, 6])], 4)).toEqual([]);
  });

  it('보너스는 비교에 쓰이지 않음(본번호만)', () => {
    const rows = [
      makeRow(2, [10, 11, 12, 13, 14, 15], 42),
      makeRow(3, [20, 21, 22, 23, 24, 25], 10),
    ];
    expect(getConsecutivelyAppearedMainNumbers(rows, 4)).toEqual([]);
  });
});
