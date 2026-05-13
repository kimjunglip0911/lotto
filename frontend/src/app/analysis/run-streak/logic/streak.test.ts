import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import {
  buildStreakResults,
  getAverageStreak,
  getMaxStreak,
  getTop5PctThreshold,
} from './streak';

function makeRow(draw_no: number, main: number[], bonus_num = 1): WinningNumberRow {
  const [num1, num2, num3, num4, num5, num6] = main;
  return { draw_no, num1, num2, num3, num4, num5, num6, bonus_num };
}

describe('buildStreakResults', () => {
  it('이력이 없으면 모든 번호 streak=0, lastDrawNo=null, isCold=false', () => {
    const results = buildStreakResults([], 10);
    expect(results).toHaveLength(45);
    expect(results[0]).toMatchObject({ number: 1, lastDrawNo: null, streak: 0, isCold: false });
    expect(results[44]).toMatchObject({ number: 45, lastDrawNo: null, streak: 0, isCold: false });
  });

  it('(N-1)회 본번호에만 포함되면 streak=0, 구간 시작 없음', () => {
    const rows = [makeRow(9, [1, 2, 3, 4, 5, 6])];
    const r = buildStreakResults(rows, 10);
    expect(r[0]).toMatchObject({ number: 1, lastDrawNo: null, streak: 0 });
    expect(r[6]).toMatchObject({ number: 7, lastDrawNo: null, streak: 0 });
  });

  it('연속 두 회차 본번호에 포함되면 streak=1, 구간 시작은 가장 작은 draw_no', () => {
    const rows = [makeRow(8, [1, 2, 3, 4, 5, 6]), makeRow(9, [1, 2, 3, 4, 5, 6])];
    const r = buildStreakResults(rows, 10);
    expect(r[0]).toMatchObject({ number: 1, lastDrawNo: 8, streak: 1 });
  });

  it('연속 세 회차 본번호에 포함되면 streak=2', () => {
    const rows = [
      makeRow(7, [1, 2, 3, 4, 5, 6]),
      makeRow(8, [1, 2, 3, 4, 5, 6]),
      makeRow(9, [1, 2, 3, 4, 5, 6]),
    ];
    const r = buildStreakResults(rows, 10);
    expect(r[0]).toMatchObject({ number: 1, lastDrawNo: 7, streak: 2 });
  });

  it('보너스만 해당 번호이고 본번호에 없으면 streak=0', () => {
    const rows = [makeRow(9, [2, 3, 4, 5, 6, 7], 1)];
    const r = buildStreakResults(rows, 10);
    expect(r[0]).toMatchObject({ number: 1, streak: 0, lastDrawNo: null });
  });

  it('빈 결과에 대한 통계 함수는 0을 반환', () => {
    expect(getAverageStreak([])).toBe(0);
    expect(getMaxStreak([])).toBe(0);
    expect(getTop5PctThreshold([])).toBe(0);
  });
});
