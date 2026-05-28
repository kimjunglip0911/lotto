import type { PositionBandDistributionRow } from '@/app/analysis/combination/types';
import { differentiateBandTargetsFromPrev } from '@/app/recommend/logic/combo/bandMonotonic';
import {
  bandIndexFromDistributionRow,
  effectiveBandRankIdx,
  pickBandIndexForPosition,
} from '@/app/recommend/logic/combo/bandRankPick';

/** 6자리 각각에 band tier(1~3)에 맞는 목표 band 인덱스 배열을 만든다 */

export const buildBandTargetsPerPosition = (
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
  prevTierTargets?: readonly number[] | null,
): number[] | null => {
  if (bandTier < 1 || bandTier > 3) return null;
  const rankIdx = bandTier - 1;
  const targets: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos);
    const sorted = [...forPos].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return bandIndexFromDistributionRow(a) - bandIndexFromDistributionRow(b);
    });
    if (sorted.length === 0) return null;
    const effRank = effectiveBandRankIdx(sorted, rankIdx);
    const picked = pickBandIndexForPosition(sorted, effRank);
    if (picked === null) return null;
    targets.push(picked);
  }
  if (prevTierTargets) {
    return differentiateBandTargetsFromPrev(targets, prevTierTargets);
  }
  return targets;
};
