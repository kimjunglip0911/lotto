import {
  CHART_HALF_H,
  CHI_SQUARE_THRESHOLD,
  NUMBERS_PER_DRAW,
  TOTAL_NUMBERS,
} from '../constants';
import type { ChiSquareResult, WinningNumberRow } from '../types';

export const buildChiSquareResults = (rows: WinningNumberRow[]): ChiSquareResult[] => {
  const n = rows.length;
  const expected = (n * NUMBERS_PER_DRAW) / TOTAL_NUMBERS;
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        counts[num - 1] += 1;
      }
    }
  }

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

/**
 * 저빈도 순위: 출현 횟수(observed) 오름차순, 동률 시 번호 오름차순.
 * 이미 채택된 번호와 동일하면 건너뛰고 다음 순위로 채움(누적번호 pickTwoHotTwoCold 저빈도 구간과 동일 패턴).
 * 화면 표기용으로 최종 4개는 오름차순 정렬해 반환한다.
 */
export const selectAdoptedNumbersByLowObserved = (
  results: ChiSquareResult[]
): readonly [number, number, number, number] | null => {
  if (results.length === 0) {
    return null;
  }

  const sorted = [...results].sort((a, b) => a.observed - b.observed || a.number - b.number);
  const picked = new Set<number>();
  const out: number[] = [];

  for (const row of sorted) {
    if (picked.has(row.number)) {
      continue;
    }
    picked.add(row.number);
    out.push(row.number);
    if (out.length === 4) {
      break;
    }
  }

  if (out.length !== 4) {
    return null;
  }

  const ascending = [...out].sort((a, b) => a - b);
  return [ascending[0], ascending[1], ascending[2], ascending[3]];
};

export const getTop5PctThreshold = (results: ChiSquareResult[]): number => {
  const positiveDeviations = results.filter((r) => r.deviation > 0).map((r) => r.deviation);
  if (positiveDeviations.length === 0) return 0;

  const sorted = [...positiveDeviations].sort((a, b) => a - b);
  const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return sorted[idx];
};

export const getExcludedNumbers = (results: ChiSquareResult[], top5PctThreshold: number): ChiSquareResult[] => {
  if (top5PctThreshold <= 0) return [];
  return results.filter((r) => r.deviation >= top5PctThreshold);
};

export const getMaxAbsDeviation = (results: ChiSquareResult[]): number => {
  if (results.length === 0) return 1;
  return Math.max(...results.map((r) => Math.abs(r.deviation)), 1);
};

export const getAverageLinePx = (top5PctThreshold: number, maxAbsDeviation: number): number => {
  return Math.round(CHART_HALF_H - (top5PctThreshold / maxAbsDeviation) * CHART_HALF_H);
};
