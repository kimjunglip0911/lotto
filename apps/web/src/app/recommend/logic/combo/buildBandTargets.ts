import type { PositionBandDistributionRow } from '@/app/combination/types';
import { BAND_TIER_REPEATS, MAX_BAND_LADDER_DEPTH } from '@/app/recommend/constants/comboThresholds';
import {
  pickBandIndexForCascadeRank,
  pickBandIndexForRank,
  sortRowsForPosition,
} from '@/app/combination/logic/rankPositionBands';

/** rank 슬롯(1~20) → 자리별 band 순위 tier(1등·2등 …). tier마다 BAND_TIER_REPEATS회 반복 */
export const bandTierForRank = (rank: number): number =>
  Math.floor((rank - 1) / BAND_TIER_REPEATS) + 1;

/** ladder[i][0] = 자리 i+1의 1등(또는 tier 시작) band 인덱스 */
export const primaryBandTargetsFromLadder = (ladder: readonly (readonly number[])[]): number[] =>
  ladder.map((rungs) => rungs[0]!);

/** tier부터 자리별 1등→2등→… band ladder. 1등 불가 시 해당 자리만 다음 순위 사용 */
export const buildBandLadderForRankCascade = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
  tier: number,
  maxDepth: number = MAX_BAND_LADDER_DEPTH,
): number[][] | null => {
  if (tier < 1 || flatByWindow.length === 0) return null;
  const startIdx = tier - 1;
  const ladders: number[][] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const sortedByWindow = flatByWindow.map((flat) =>
      sortRowsForPosition(flat.filter((r) => r.position === pos)),
    );
    if (sortedByWindow.every((sorted) => sorted.length === 0)) return null;
    const ladder: number[] = [];
    for (let rankIdx = startIdx; rankIdx < startIdx + maxDepth; rankIdx++) {
      const picked = pickBandIndexForCascadeRank(sortedByWindow, rankIdx);
      if (picked === null) break;
      if (!ladder.includes(picked)) ladder.push(picked);
    }
    if (ladder.length === 0) return null;
    ladders.push(ladder);
  }
  return ladders;
};

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

/** 3→6→12개월 cascade 윈도우별 flat rows로 rank에 맞는 band 인덱스 배열을 만든다 */
export const buildBandTargetsForRankCascade = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
  rank: number,
): number[] | null => {
  if (rank < 1 || flatByWindow.length === 0) return null;
  const rankIdx = rank - 1;
  const targets: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const sortedByWindow = flatByWindow.map((flat) =>
      sortRowsForPosition(flat.filter((r) => r.position === pos)),
    );
    if (sortedByWindow.every((sorted) => sorted.length === 0)) return null;
    const picked = pickBandIndexForCascadeRank(sortedByWindow, rankIdx);
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
