import type { PositionBandDistributionRow } from '../types';

export type UseCombinationAnalysisDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  positionBandRows: PositionBandDistributionRow[];
};
