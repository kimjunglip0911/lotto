import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import type { PositionBandDistributionRow } from '../types';

/** 번호대 라벨(1~45를 5개 번호 단위 9구간으로 분할) */
export const NUMBER_BAND_LABELS = [
  '1~5',
  '6~10',
  '11~15',
  '16~20',
  '21~25',
  '26~30',
  '31~35',
  '36~40',
  '41~45',
] as const;

const BAND_COUNT = NUMBER_BAND_LABELS.length;
const POSITION_COUNT = 6;
const BAND_WIDTH = 5;

/** 1~45를 5단위 구간 인덱스(0~8)로 매핑 — 조합 세트 검증에서 동일 규칙 재사용 */
export function numberToBandIndex(n: number): number {
  const clamped = Math.min(45, Math.max(1, Math.round(n)));
  return Math.floor((clamped - 1) / BAND_WIDTH);
}

/**
 * 소수 둘째 자리까지 내린 뒤, 잔여를 최대 잔차법으로 배분해 합계가 정확히 100.00이 되게 한다.
 */
function percentagesWithExactHundredSum(counts: readonly number[], totalDraws: number): number[] {
  if (totalDraws === 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c / totalDraws) * 100);
  const floored = exact.map((e) => Math.floor(e * 100 + 1e-9) / 100);
  const sumFloored = floored.reduce((a, b) => a + b, 0);
  let remainderHundredths = Math.round((100 - sumFloored) * 100);
  if (remainderHundredths < 0) remainderHundredths = 0;

  const order = exact
    .map((e, i) => ({
      i,
      frac: e * 100 - Math.floor(e * 100 + 1e-9),
    }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (let k = 0; k < remainderHundredths && k < order.length; k++) {
    result[order[k].i] += 0.01;
  }
  return result;
}

/**
 * 각 회차 주번호 6개(num1~num6, 오름차순)만 사용한다. 보너스는 제외한다.
 * 자리(1~6)마다 번호대별 건수·비율(%)을 계산하며, 각 자리에서 비율 합은 100.00이다.
 */
export function buildPositionBandDistribution(rows: readonly WinningNumberRow[]): {
  totalDraws: number;
  rows: PositionBandDistributionRow[];
} {
  const totalDraws = rows.length;
  if (totalDraws === 0) {
    return { totalDraws: 0, rows: [] };
  }

  /** [position 0~5][band 0~8] */
  const grid: number[][] = Array.from({ length: POSITION_COUNT }, () =>
    Array.from({ length: BAND_COUNT }, () => 0),
  );

  for (const row of rows) {
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    for (let p = 0; p < POSITION_COUNT; p++) {
      const b = numberToBandIndex(mains[p]);
      grid[p][b]++;
    }
  }

  const flat: PositionBandDistributionRow[] = [];
  for (let p = 0; p < POSITION_COUNT; p++) {
    const counts = grid[p];
    const percentages = percentagesWithExactHundredSum(counts, totalDraws);
    for (let b = 0; b < BAND_COUNT; b++) {
      flat.push({
        position: p + 1,
        bandLabel: NUMBER_BAND_LABELS[b],
        drawCount: counts[b],
        percentage: percentages[b],
      });
    }
  }

  return { totalDraws, rows: flat };
}
