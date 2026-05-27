import { NUMBERS_PER_DRAW, TOTAL_NUMBERS } from '../../constants';
import type { ChiSquareResult } from '../../types';
import { mapCountsToChiResults } from '../chiSqCore';

/** 이전 회차 수가 `pastDraws`일 때 번호별 O·E·편차·χ² (회차당 본번호 6개만 누적 집계). */
export const buildChiSquareResultsFromCounts = (
  counts: readonly number[],
  pastDraws: number,
): ChiSquareResult[] => mapCountsToChiResults(counts, pastDraws, NUMBERS_PER_DRAW, TOTAL_NUMBERS);
