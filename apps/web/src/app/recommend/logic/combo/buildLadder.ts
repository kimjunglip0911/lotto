import type { PositionBandDistributionRow } from '@/app/combination/types';
import { eligibleSorted, wrapEligibleLadder } from '@/app/combination/logic/eligibleBands';
import { BAND_LADDER_START_TIER } from '@/app/recommend/constants/comboThresholds';
import { primaryBandTargetsFromLadder } from '@/app/recommend/logic/combo/buildBandTargets';

const lastFlat = (
  windows: readonly (readonly PositionBandDistributionRow[])[],
): readonly PositionBandDistributionRow[] => windows[windows.length - 1] ?? [];

/** 저장본 마지막 창 기준, 자리별 1%↑ 순환 ladder */
export const buildBandLadderForRankCascade = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
  tier: number = BAND_LADDER_START_TIER,
): number[][] | null => {
  const flat = lastFlat(flatByWindow);
  if (tier < 1 || flat.length === 0) return null;
  const ladders: number[][] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const ladder = wrapEligibleLadder(eligibleSorted(flat, pos), tier);
    if (ladder.length === 0) return null;
    ladders.push(ladder);
  }
  return ladders;
};

export const buildBandTargetsForRankCascade = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
  rank: number,
): number[] | null => {
  const ladder = buildBandLadderForRankCascade(flatByWindow, rank);
  if (!ladder) return null;
  return primaryBandTargetsFromLadder(ladder);
};
