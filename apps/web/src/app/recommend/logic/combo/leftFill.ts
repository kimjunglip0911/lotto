import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  LEFT_BAND_MAX,
  LEFT_BAND_MIN,
  leftBandTier,
} from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import {
  buildBandLadderForRankCascade,
  buildBandTargetsForRankCascade,
} from '@/app/recommend/logic/combo/buildBandTargets';

/** 1부터 20세트 이후 조합분석 미사용 등수 목표를 붙인다 */

export const attachLeftPools = (
  ctx: FillCtx,
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
): void => {
  ctx.leftPoolByBand = ctx.poolByBand;
  for (let rank = LEFT_BAND_MIN; rank <= LEFT_BAND_MAX; rank++) {
    const tier = leftBandTier(rank);
    const targets = buildBandTargetsForRankCascade(flatByWindow, tier);
    const ladder = buildBandLadderForRankCascade(flatByWindow, tier);
    if (!targets || !ladder) continue;
    ctx.targetsByRank.set(rank, targets);
    ctx.laddersByRank.set(rank, ladder);
  }
};
