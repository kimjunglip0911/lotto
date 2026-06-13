import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import type { PositionBandDistributionRow, SumExtremeStats } from '../types';
import { buildPositionBandDistribution } from './buildPositionBandDistribution';
import { buildSumExtremeStats } from './buildSumExtremeStats';

export type ComboAnalysisResult = {
  totalDraws: number;
  positionBandRows: PositionBandDistributionRow[];
  sumExtremeStats: SumExtremeStats | null;
};

export function runComboAnalysis(rows: readonly WinningNumberRow[]): ComboAnalysisResult {
  const positionBand = buildPositionBandDistribution(rows);
  return {
    totalDraws: positionBand.totalDraws,
    positionBandRows: positionBand.rows,
    sumExtremeStats: buildSumExtremeStats(rows),
  };
}
