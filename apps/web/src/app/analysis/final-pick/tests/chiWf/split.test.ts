import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import {
  getChiSquareWalkForwardExcludedNumbers,
  getChiSquareWalkForwardExcludedSplit,
  getChiSquareWalkForwardSurvivorNumbers,
} from '../../logic/chiWf';

const mkChi = (number: number, deviation: number): ChiSquareResult => ({
  number,
  observed: 0,
  expected: 0,
  deviation,
  chiSquare: 0,
  isLowFreq: false,
  isHighFreq: false,
});

describe('chiWf split/survivor', () => {
  it('구간 통계에 따라 번호를 필터한다', () => {
    const results = [mkChi(1, 0), mkChi(2, 0), mkChi(3, 5)];
    const allBins = [
      { binKey: 'b_0', label: '', hits: 0, roundsHit: 100, roundsMatched: 11, pct: 11 },
      { binKey: 'b_5', label: '', hits: 0, roundsHit: 100, roundsMatched: 5, pct: 5 },
    ];
    const survivors = getChiSquareWalkForwardSurvivorNumbers(results, allBins);
    const excluded = getChiSquareWalkForwardExcludedNumbers(results, allBins);
    const split = getChiSquareWalkForwardExcludedSplit(results, allBins);
    expect(survivors).toEqual([1, 2]);
    expect(excluded).toEqual([3]);
    expect(split.byConditionalPct).toEqual([3]);
    expect(split.byOverlapRounds).toEqual([3]);
  });

  it('조건부 확률만·겹침만 해당을 나눈다', () => {
    const results = [mkChi(1, 0), mkChi(2, 5)];
    const allBins = [
      { binKey: 'b_0', label: '', hits: 0, roundsHit: 200, roundsMatched: 11, pct: 0 },
      { binKey: 'b_5', label: '', hits: 0, roundsHit: 10, roundsMatched: 5, pct: 10 },
    ];
    const split = getChiSquareWalkForwardExcludedSplit(results, allBins);
    expect(split.byConditionalPct).toEqual([1]);
    expect(split.byOverlapRounds).toEqual([2]);
  });
});
