import {
  TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT,
  TREND_EXCLUSION_THRESHOLD_PERCENT,
} from '@/app/analysis/trend/constants';
import { aggregateDeviationBins } from '@/app/analysis/trend/logic/trendDeviationBins';
import { computeEmpiricalAppearanceRate, buildTrendResults } from '@/app/analysis/trend/logic/trend';
import type { WinningNumberRow } from '../types';

const toBinKey = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  return `mid_${Math.floor(pct)}`;
};

/**
 * trend 이력 기준으로 번호별 편차 구간 요약을 조회해 제외번호를 계산한다.
 * - 출현확률이 임계(기본 15%) 이하이거나, 구간의 당첨 포함 회차가 임계(기본 10) 이하이면 제외
 * - 둘 중 하나만 만족해도 제외(OR)
 */
export const getTrendExcludedNumbers = (rows: WinningNumberRow[]): number[] => {
  if (rows.length === 0) return [];

  const sortedRows = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  const baseline = computeEmpiricalAppearanceRate(sortedRows);
  if (baseline <= 0) return [];

  const summary = aggregateDeviationBins(sortedRows);
  const binRowByKey = new Map(summary.rows.map((row) => [row.key, row] as const));

  return buildTrendResults(sortedRows)
    .filter(({ ema }) => {
      const key = toBinKey((ema - baseline) * 100);
      const binRow = binRowByKey.get(key);
      if (!binRow) return false;
      const lowProbability = binRow.appearanceProbability <= TREND_EXCLUSION_THRESHOLD_PERCENT;
      const lowWinningHitDraws = binRow.winningHitDrawCount <= TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT;
      return lowProbability || lowWinningHitDraws;
    })
    .map(({ number }) => number);
};

