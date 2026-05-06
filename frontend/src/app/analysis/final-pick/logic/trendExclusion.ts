import { aggregateDeviationBins } from '@/app/analysis/trend/logic/trendDeviationBins';
import { computeEmpiricalAppearanceRate, buildTrendResults } from '@/app/analysis/trend/logic/trend';
import type { WinningNumberRow } from '../types';

const TREND_EXCLUSION_THRESHOLD = 20;

const toBinKey = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  return `mid_${Math.floor(pct)}`;
};

/**
 * trend 이력 기준으로 번호별 편차 구간 출현확률을 조회해 제외번호를 계산한다.
 * - 출현확률 <= 20.00 이면 제외
 * - 출현확률 >= 20.01 이면 제외하지 않음
 */
export const getTrendExcludedNumbers = (rows: WinningNumberRow[]): number[] => {
  if (rows.length === 0) return [];

  const sortedRows = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  const baseline = computeEmpiricalAppearanceRate(sortedRows);
  if (baseline <= 0) return [];

  const summary = aggregateDeviationBins(sortedRows);
  const probabilityByBinKey = new Map(summary.rows.map((row) => [row.key, row.appearanceProbability] as const));

  return buildTrendResults(sortedRows)
    .filter(({ ema }) => {
      const key = toBinKey((ema - baseline) * 100);
      const probability = probabilityByBinKey.get(key);
      return typeof probability === 'number' && probability <= TREND_EXCLUSION_THRESHOLD;
    })
    .map(({ number }) => number);
};

