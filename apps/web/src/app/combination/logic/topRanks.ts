import { TOP_BAND_RANK } from '../constants/topRank';
import type { PositionBandRankRow } from '../types';

/** 화면 표시용으로 자리별 상위 순위만 남긴다. */
export const takeTopRanks = (
  rows: readonly PositionBandRankRow[],
  limit: number = TOP_BAND_RANK,
): PositionBandRankRow[] => rows.filter((row) => row.rank <= limit);
