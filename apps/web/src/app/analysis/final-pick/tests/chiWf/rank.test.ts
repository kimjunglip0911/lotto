import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import { rankChiSquareNumbersByConditionalProbability } from '../../logic/chiWf';

const mkChi = (number: number, deviation: number): ChiSquareResult => ({
  number,
  observed: 0,
  expected: 0,
  deviation,
  chiSquare: 0,
  isLowFreq: false,
  isHighFreq: false,
});

describe('rankChiSquareNumbersByConditionalProbability', () => {
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
});
