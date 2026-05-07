import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import type { WinningNumberRow } from '../types';
import {
  getChiSquareAdoptedNumbers,
  getChiSquareFinalPickSlice,
  getChiSquareWalkForwardExcludedNumbers,
  getChiSquareWalkForwardExcludedSplit,
  getChiSquareWalkForwardSurvivorNumbers,
  isChiSquareNumberExcludedByWalkForwardBin,
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

  describe('isChiSquareNumberExcludedByWalkForwardBin', () => {
    it('조건부 확률이 6% 이하이면 제외(정수 비교)', () => {
      expect(
        isChiSquareNumberExcludedByWalkForwardBin({
          binKey: 'b_0',
          label: '',
          hits: 0,
          roundsHit: 100,
          roundsMatched: 6,
          pct: 6,
        }),
      ).toBe(true);
    });

    it('겹침 회차가 3회 이하면 제외', () => {
      expect(
        isChiSquareNumberExcludedByWalkForwardBin({
          binKey: 'b_0',
          label: '',
          hits: 0,
          roundsHit: 100,
          roundsMatched: 3,
          pct: 50,
        }),
      ).toBe(true);
    });

    it('겹침 회차 4회·조건부 확률 20%면 잔여', () => {
      expect(
        isChiSquareNumberExcludedByWalkForwardBin({
          binKey: 'b_0',
          label: '',
          hits: 0,
          roundsHit: 30,
          roundsMatched: 4,
          pct: 22,
        }),
      ).toBe(false);
    });

  });

  describe('getChiSquareWalkForwardSurvivorNumbers', () => {
    it('구간 통계에 따라 번호를 필터한다', () => {
      const results = [mkChi(1, 0), mkChi(2, 0), mkChi(3, 5)];
      const allBins = [
        {
          binKey: 'b_0',
          label: '',
          hits: 0,
          roundsHit: 100,
          roundsMatched: 11,
          pct: 11,
        },
        {
          binKey: 'b_5',
          label: '',
          hits: 0,
          roundsHit: 100,
          roundsMatched: 3,
          pct: 5,
        },
      ];
      const survivors = getChiSquareWalkForwardSurvivorNumbers(results, allBins);
      const excluded = getChiSquareWalkForwardExcludedNumbers(results, allBins);
      const split = getChiSquareWalkForwardExcludedSplit(results, allBins);
      expect(survivors).toEqual([1, 2]);
      expect(excluded).toEqual([3]);
      expect(split.byConditionalPct).toEqual([3]);
      expect(split.byOverlapRounds).toEqual([3]);
      const merged = [...survivors, ...excluded].sort((a, b) => a - b);
      expect(merged).toEqual([1, 2, 3]);
    });

    it('조건부 확률만 해당·겹침만 해당을 나눈다', () => {
      const results = [mkChi(1, 0), mkChi(2, 5)];
      const allBins = [
        {
          binKey: 'b_0',
          label: '',
          hits: 0,
          roundsHit: 200,
          roundsMatched: 11,
          pct: 0,
        },
        {
          binKey: 'b_5',
          label: '',
          hits: 0,
          roundsHit: 20,
          roundsMatched: 3,
          pct: 0,
        },
      ];
      const split = getChiSquareWalkForwardExcludedSplit(results, allBins);
      expect(split.byConditionalPct).toEqual([1]);
      expect(split.byOverlapRounds).toEqual([2]);
    });
  });

  it('getChiSquareFinalPickSlice는 채택과 워크포워드 제외를 한 번에 반환한다', () => {
    const slice = getChiSquareFinalPickSlice({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
      accumulatedExclusionNumbers: [],
    });
    expect(slice.adopted.length).toBeGreaterThan(0);
    const union = new Set([...slice.walkForwardExcluded, ...slice.adopted]);
    expect(union.size).toBe(45);
    expect(slice.walkForwardExcludedByConditionalPct.length).toBeGreaterThanOrEqual(0);
    expect(slice.walkForwardExcludedByOverlapRounds.length).toBeGreaterThanOrEqual(0);
  });

  it('워크포워드 잔여 번호에서 누적·제외 집합을 뺀다', () => {
    const base = getChiSquareAdoptedNumbers({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      excludedByTrendNumbers: [],
      accumulatedExclusionNumbers: [],
    });
    expect(base.length).toBeGreaterThanOrEqual(4);

    const remove = new Set([base[0], base[1], base[2], base[3]] as number[]);
    const result = getChiSquareAdoptedNumbers({
      previousDrawRows: createRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [base[0] as number, base[1] as number],
      excludedByTrendNumbers: [base[2] as number],
      accumulatedExclusionNumbers: [base[3] as number],
    });

    for (const n of remove) {
      expect(result).not.toContain(n);
    }
    expect(result.length).toBe(base.filter((n) => !remove.has(n)).length);
    expect([...result].sort((a, b) => a - b)).toEqual(result);
  });
});
