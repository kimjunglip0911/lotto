import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { BAND_COUNT, NUMBER_BAND_LABELS, POSITION_COUNT } from '../constants/bandLabels';
import { percentagesWithExactHundredSum } from '../helpers/pctExactSum';
import type { PositionBandDistributionRow } from '../types';
import { numberToBandIndex } from './numberToBand';

export { NUMBER_BAND_LABELS } from '../constants/bandLabels';
export { numberToBandIndex } from './numberToBand';

/**
 * 각 회차 주번호 6개(num1~num6)만 사용한다. 보너스는 제외한다.
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

  const grid: number[][] = Array.from({ length: POSITION_COUNT }, () =>
    Array.from({ length: BAND_COUNT }, () => 0),
  );

  for (const row of rows) {
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    for (let p = 0; p < POSITION_COUNT; p++) {
      grid[p][numberToBandIndex(mains[p])]++;
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
