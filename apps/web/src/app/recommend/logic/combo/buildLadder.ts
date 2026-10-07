import type { PositionBandDistributionRow } from '@/app/combination/types';
import { wrapEligibleLadder } from '@/app/combination/logic/eligibleBands';
import { topEligible } from '@/app/combination/logic/topElig';
import { BAND_LADDER_START_TIER } from '@/app/recommend/constants/comboThresholds';
import { primaryBandTargetsFromLadder } from '@/app/recommend/logic/combo/buildBandTargets';

const lastFlat = (
  windows: readonly (readonly PositionBandDistributionRow[])[],
): readonly PositionBandDistributionRow[] => windows[windows.length - 1] ?? [];

/** 마지막 창의 1%↑ 10등 안에서, 자리별 시작 등수부터 순환하는 ladder */
export const buildBandLadderForRankCascade = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
  tier: number = BAND_LADDER_START_TIER,
): number[][] | null => {
  const flat = lastFlat(flatByWindow);
  if (tier < 1 || flat.length === 0) return null;
  const ladders: number[][] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const ladder = wrapEligibleLadder(topEligible(flat, pos), tier);
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
