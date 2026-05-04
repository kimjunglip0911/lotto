import {
  BASELINE_PHASE_BAND,
  CHART_INNER_H,
  CHART_PADDING_TOP,
  K_TREND,
  TOTAL_NUMBERS,
} from '../constants';
import type { NumberTrendResult, TrendPhase, WinningNumberRow } from '../types';

/** 주번호 6개만 사용(보너스 제외). */
const mainNumbersOf = (row: WinningNumberRow): readonly number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

/**
 * 이력 전체에서 주번호 6개만 집계한 출현 비율(보너스 제외).
 * 정상 데이터면 `MAIN_NUMBERS_PER_DRAW / TOTAL_NUMBERS`에 수렴.
 */
export const computeEmpiricalAppearanceRate = (rows: WinningNumberRow[]): number => {
  if (rows.length === 0) return 0;
  let total = 0;
  for (const row of rows) {
    for (const n of mainNumbersOf(row)) {
      if (n >= 1 && n <= TOTAL_NUMBERS) total += 1;
    }
  }
  return total / (rows.length * TOTAL_NUMBERS);
};

/** 주6 출현 여부(0/1)로 고정 k EMA. */
export const buildTrendEma = (rows: WinningNumberRow[], num: number, k: number): number => {
  if (rows.length === 0) return 0;
  let ema = 0;
  for (const row of rows) {
    const signal = mainNumbersOf(row).includes(num) ? 1 : 0;
    ema = signal * k + ema * (1 - k);
  }
  return ema;
};

/**
 * 단일 EMA와 이력 기반 기댓값의 차이로 4국면 분류.
 * d = ema − baseline: d > band → 상승지속, 0 < d ≤ band → 하락전환, −band ≤ d ≤ 0 → 회복중, d < −band → 하락지속.
 */
export const classifyPhase = (ema: number, baseline: number, band: number = BASELINE_PHASE_BAND): TrendPhase => {
  const d = ema - baseline;
  if (d > band) return 'up_cont';
  if (d > 0) return 'topping';
  if (d >= -band) return 'recovering';
  return 'down_cont';
};

export const buildTrendResults = (
  allRows: WinningNumberRow[],
  baseline: number,
): NumberTrendResult[] => {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const number = i + 1;
    const ema = buildTrendEma(allRows, number, K_TREND);
    const phase = classifyPhase(ema, baseline);
    return { number, ema, phase };
  });
};

export const rateToY = (rate: number, maxRate: number): number => {
  if (maxRate <= 0) return CHART_PADDING_TOP + CHART_INNER_H;
  const ratio = Math.min(rate / maxRate, 1);
  return CHART_PADDING_TOP + CHART_INNER_H * (1 - ratio);
};
