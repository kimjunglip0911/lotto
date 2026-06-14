import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  pickBandIndexForCascadeRank,
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
