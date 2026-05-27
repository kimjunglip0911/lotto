import type { ChiSquareResult } from '../types';

export const sortChiByDeviation = (results: ChiSquareResult[]): ChiSquareResult[] =>
  [...results].sort((a, b) => a.deviation - b.deviation || a.number - b.number);
