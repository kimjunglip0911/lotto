import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  pickBandIndexForRank,
  sortRowsForPosition,
} from '@/app/combination/logic/rankPositionBands';

/** 6자리 각각에 rank(1~20)에 맞는 목표 band 인덱스 배열을 만든다 */

export const buildBandTargetsForRank = (
  flat: readonly PositionBandDistributionRow[],
  rank: number,
): number[] | null => {
  if (rank < 1) return null;
  const rankIdx = rank - 1;
  const targets: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos);
    const sorted = sortRowsForPosition(forPos);
    if (sorted.length === 0) return null;
    const picked = pickBandIndexForRank(sorted, rankIdx);
    if (picked === null) return null;
    targets.push(picked);
  }
  return targets;
};

/** @deprecated buildBandTargetsForRank 사용 */
export const buildBandTargetsPerPosition = (
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
): number[] | null => buildBandTargetsForRank(flat, bandTier);
