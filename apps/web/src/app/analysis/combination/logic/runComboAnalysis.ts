import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import type {
  OddEvenDistributionRow,
  PositionBandDistributionRow,
  SumExtremeStats,
} from '../types';
import { buildOddEvenDistribution } from './buildOddEvenDistribution';
import { buildPositionBandDistribution } from './buildPositionBandDistribution';
import { buildSumExtremeStats } from './buildSumExtremeStats';

export type ComboAnalysisResult = {
  totalDraws: number;
  oddEvenRows: OddEvenDistributionRow[];
  positionBandRows: PositionBandDistributionRow[];
  sumExtremeStats: SumExtremeStats | null;
};

export function runComboAnalysis(rows: readonly WinningNumberRow[]): ComboAnalysisResult {
  const oddEven = buildOddEvenDistribution(rows);
  const positionBand = buildPositionBandDistribution(rows);
  return {
    totalDraws: oddEven.totalDraws,
    oddEvenRows: oddEven.rows,
    positionBandRows: positionBand.rows,
    sumExtremeStats: buildSumExtremeStats(rows),
  };
}
