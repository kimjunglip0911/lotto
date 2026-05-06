import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import { getAccumulatedAdoptedNumbers } from './accumulatedAdoption';

const row = (drawNo: number, nums: [number, number, number, number, number, number]): WinningNumberRow => ({
  draw_no: drawNo,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

const createRows = (count: number): WinningNumberRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const drawNo = idx + 1;
    return row(drawNo, [
      ((drawNo + 0) % 45) + 1,
      ((drawNo + 7) % 45) + 1,
      ((drawNo + 14) % 45) + 1,
      ((drawNo + 21) % 45) + 1,
      ((drawNo + 28) % 45) + 1,
      ((drawNo + 35) % 45) + 1,
    ]);
  });

describe('getAccumulatedAdoptedNumbers', () => {
  it('기본적으로 2년 4개 + 전체 4개의 고유 번호를 반환한다', () => {
    const result = getAccumulatedAdoptedNumbers({
      previousDrawRows: createRows(200),
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
    });

    expect(result.twoYearNumbers.length).toBe(4);
    expect(result.allTimeNumbers.length).toBe(4);
    expect(result.finalNumbers.length).toBe(8);
    expect(new Set(result.finalNumbers).size).toBe(8);
  });

  it('제외 번호가 포함되면 다음 순위 번호로 대체한다', () => {
    const base = getAccumulatedAdoptedNumbers({
      previousDrawRows: createRows(200),
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
    });

    const result = getAccumulatedAdoptedNumbers({
      previousDrawRows: createRows(200),
      excludedByStreakNumbers: [base.finalNumbers[0] as number],
      excludedByTrendNumbers: [base.finalNumbers[1] as number],
    });

    expect(result.finalNumbers).not.toContain(base.finalNumbers[0] as number);
    expect(result.finalNumbers).not.toContain(base.finalNumbers[1] as number);
  });

  it('그룹 간 중복 후보가 생겨도 최종 8개를 고유하게 유지한다', () => {
    const rows = createRows(20);
    const result = getAccumulatedAdoptedNumbers({
      previousDrawRows: rows,
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
    });

    expect(result.twoYearNumbers.length).toBe(4);
    expect(result.allTimeNumbers.length).toBe(4);
    expect(new Set(result.finalNumbers).size).toBe(result.finalNumbers.length);
  });

  it('후보가 부족한 극단 상황에서는 가능한 개수까지만 반환한다', () => {
    const excludedAll = Array.from({ length: 45 }, (_, i) => i + 1).slice(0, 43);
    const result = getAccumulatedAdoptedNumbers({
      previousDrawRows: createRows(150),
      excludedByStreakNumbers: excludedAll,
      excludedByTrendNumbers: [],
    });

    expect(result.finalNumbers.length).toBeLessThan(8);
    expect(new Set(result.finalNumbers).size).toBe(result.finalNumbers.length);
  });
});
