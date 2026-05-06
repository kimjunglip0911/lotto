import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import type { WinningNumberRow } from '../types';
import {
  getChiSquareAdoptedNumbers,
  rankChiSquareNumbersByConditionalProbability,
} from './chiSquareAdoption';

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

const mkChi = (number: number, deviation: number): ChiSquareResult => ({
  number,
  observed: 0,
  expected: 0,
  deviation,
  chiSquare: 0,
  isLowFreq: false,
  isHighFreq: false,
});

describe('chiSquareAdoption', () => {
  it('조건부 확률(%) 내림차순으로 음/양 구간을 통합 정렬한다', () => {
    const ranked = rankChiSquareNumbersByConditionalProbability(
      [mkChi(1, -2), mkChi(2, 4), mkChi(3, -2), mkChi(4, 1)],
      [
        { binKey: 'b_-2', pct: 80 },
        { binKey: 'b_4', pct: 60 },
        { binKey: 'b_1', pct: 80 },
      ],
    );

    expect(ranked).toEqual([1, 3, 4, 2]);
  });

  it('기본적으로 중복 없는 10개 번호를 채택한다', () => {
    const adopted = getChiSquareAdoptedNumbers({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
      adoptedByAccumulatedNumbers: [],
    });

    expect(adopted.length).toBe(10);
    expect(new Set(adopted).size).toBe(10);
  });

  it('제외/누적번호와 겹치면 다음 순위로 치환한다', () => {
    const base = getChiSquareAdoptedNumbers({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
      adoptedByAccumulatedNumbers: [],
    });

    const result = getChiSquareAdoptedNumbers({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [base[0] as number, base[1] as number],
      excludedByTrendNumbers: [base[2] as number],
      adoptedByAccumulatedNumbers: [base[3] as number],
    });

    expect(result).not.toContain(base[0] as number);
    expect(result).not.toContain(base[1] as number);
    expect(result).not.toContain(base[2] as number);
    expect(result).not.toContain(base[3] as number);
    expect(result.length).toBe(10);
  });
});
