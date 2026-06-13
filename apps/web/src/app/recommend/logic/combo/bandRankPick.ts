import {
  bandIndexFromLabel,
  pickBandIndexForRank,
  sortRowsForPosition,
} from '@/app/analysis/combination/logic/rankPositionBands';

export {
  bandIndexFromLabel,
  pickBandIndexForRank as pickBandIndexForPosition,
  sortRowsForPosition,
};

/** @deprecated rank 1~20 경로에서는 사용하지 않음 */
export const effectiveBandRankIdx = (_sorted: readonly unknown[], rankIdx: number): number =>
  rankIdx;

export const bandIndexFromDistributionRow = (row: { bandLabel: string }): number =>
  bandIndexFromLabel(row.bandLabel);
