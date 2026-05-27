import type { NumberTrendResult } from '../types';

export const calcMaxRate = (trendResults: NumberTrendResult[], trendBaseline: number): number => {
  const floor = 0.02;
  const emaVals = trendResults.map((r) => r.ema);
  if (emaVals.length === 0) return Math.max(trendBaseline * 2, floor);
  return Math.max(...emaVals, trendBaseline * 1.5, floor);
};
