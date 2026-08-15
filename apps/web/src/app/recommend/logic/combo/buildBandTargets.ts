import type { PositionBandDistributionRow } from '@/app/combination/types';
import { eligibleSorted, wrapEligibleLadder } from '@/app/combination/logic/eligibleBands';

/** rank N 세트는 N등 band부터 ladder 시작 */
export const bandTierForRank = (rank: number): number => rank;

/** ladder[i][0] = 자리 i+1의 시작 band 인덱스 */
export const primaryBandTargetsFromLadder = (
  ladder: readonly (readonly number[])[],
): number[] => ladder.map((rungs) => rungs[0]!);

/** 6자리 각각 RANK N 시작 번호대(1%↑ 순환) */
export const buildBandTargetsForRank = (
  flat: readonly PositionBandDistributionRow[],
  rank: number,
): number[] | null => {
  if (rank < 1 || flat.length === 0) return null;
  const targets: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const ladder = wrapEligibleLadder(eligibleSorted(flat, pos), rank);
    if (ladder.length === 0) return null;
    targets.push(ladder[0]!);
  }
  return targets;
};

/** @deprecated buildBandTargetsForRank 사용 */
export const buildBandTargetsPerPosition = (
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
): number[] | null => buildBandTargetsForRank(flat, bandTier);
