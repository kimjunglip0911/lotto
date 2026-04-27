import {
  BASELINE,
  CHART_INNER_H,
  CHART_PADDING_TOP,
  K_CONFIG,
  TOTAL_NUMBERS,
} from '../constants';
import type { NumberTrendResult, TrendPhase, WinningNumberRow } from '../types';

export const buildFixedKEma = (rows: WinningNumberRow[], num: number, k: number): number => {
  if (rows.length === 0) return 0;
  let ema = 0;
  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    const signal = nums.includes(num) ? 1 : 0;
    ema = signal * k + ema * (1 - k);
  }
  return ema;
};

export const classifyPhase = (emaFast: number, emaSlow: number): TrendPhase => {
  const shortTermUp = emaFast > emaSlow;
  const longTermUp = emaSlow > BASELINE;
  if (shortTermUp && longTermUp) return 'up_cont';
  if (!shortTermUp && longTermUp) return 'topping';
  if (shortTermUp && !longTermUp) return 'recovering';
  return 'down_cont';
};

export const buildTrendResults = (allRows: WinningNumberRow[]): NumberTrendResult[] => {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const number = i + 1;
    const emaFast = buildFixedKEma(allRows, number, K_CONFIG.fast);
    const emaSlow = buildFixedKEma(allRows, number, K_CONFIG.slow);
    const phase = classifyPhase(emaFast, emaSlow);
    return { number, emaFast, emaSlow, phase };
  });
};

export const rateToY = (rate: number, maxRate: number): number => {
  if (maxRate <= 0) return CHART_PADDING_TOP + CHART_INNER_H;
  const ratio = Math.min(rate / maxRate, 1);
  return CHART_PADDING_TOP + CHART_INNER_H * (1 - ratio);
};
