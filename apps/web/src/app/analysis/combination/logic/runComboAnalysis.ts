import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import type {
  ConsecutiveRunDistributionRow,
  OddEvenDistributionRow,
  PositionBandDistributionRow,
  SumExtremeStats,
} from '../types';
import { buildConsecutiveRunDistribution } from './buildConsecutiveRunDistribution';
import { buildOddEvenDistribution } from './buildOddEvenDistribution';
import { buildPositionBandDistribution } from './buildPositionBandDistribution';
import { buildSumExtremeStats } from './buildSumExtremeStats';

export type ComboAnalysisResult = {
  totalDraws: number;
  oddEvenRows: OddEvenDistributionRow[];
  consecutiveRows: ConsecutiveRunDistributionRow[];
  positionBandRows: PositionBandDistributionRow[];
  sumExtremeStats: SumExtremeStats | null;
};

export function runComboAnalysis(rows: readonly WinningNumberRow[]): ComboAnalysisResult {
  const oddEven = buildOddEvenDistribution(rows);
  const consecutive = buildConsecutiveRunDistribution(rows);
  const positionBand = buildPositionBandDistribution(rows);
  return {
    totalDraws: oddEven.totalDraws,
    oddEvenRows: oddEven.rows,
    consecutiveRows: consecutive.rows,
    positionBandRows: positionBand.rows,
    sumExtremeStats: buildSumExtremeStats(rows),
  };
}
