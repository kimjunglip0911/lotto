import type { PositionBandDistributionRow } from '../types';
import { TOP_BAND_RANK } from '../constants/topRank';
import { eligibleSorted } from './eligibleBands';

/** 자리별 1% 이상 중 10등까지. 다음 등수는 이 목록 안에서만 순환한다. */
export const topEligible = (
  rows: readonly PositionBandDistributionRow[],
  pos: number,
): PositionBandDistributionRow[] => eligibleSorted(rows, pos).slice(0, TOP_BAND_RANK);
