import { CHI_SQUARE_THRESHOLD } from '../constants';
import type { ChiSquareResult } from '../types';

/** 관측 횟수 배열과 과거 회차 수로 번호별 O·E·편차·χ² 행을 만든다. */
export const mapCountsToChiResults = (
  counts: readonly number[],
  pastDraws: number,
  numbersPerDraw: number,
  totalNumbers: number,
): ChiSquareResult[] => {
  const expected = (pastDraws * numbersPerDraw) / totalNumbers;
  return counts.map((observed, index) => {
    const deviation = observed - expected;
    const chiSquare = expected > 0 ? (deviation * deviation) / expected : 0;
    return {
      number: index + 1,
      observed,
      expected,
      deviation,
      chiSquare,
      isLowFreq: observed < expected && chiSquare >= CHI_SQUARE_THRESHOLD,
      isHighFreq: observed > expected && chiSquare >= CHI_SQUARE_THRESHOLD,
    };
  });
};
