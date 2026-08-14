import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  LEFT_BAND_MAX,
  LEFT_BAND_MIN,
  LEFT_POOL_MIN,
  leftBandTier,
} from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { leftoverPool } from '@/app/recommend/logic/combo/leftPool';
import {
  buildBandLadderForRankCascade,
  buildBandTargetsForRankCascade,
} from '@/app/recommend/logic/combo/buildBandTargets';
import { keepPoolGapLookup, rerankGapLookup } from '@/app/recommend/logic/gap/keepPoolGaps';
import { buildPoolByBand } from '@/app/recommend/logic/repair';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 1부터 20세트 이후 leftover 풀·band 목표를 붙인다 */

export const attachLeftPools = (
  ctx: FillCtx,
  poolSorted: readonly number[],
  fullGapLookup: GapRankLookup,
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
): { gapPool: number[]; bandPool: number[] } => {
  const gapPool = leftoverPool(ctx.profileSlots, poolSorted, 0, 10, LEFT_POOL_MIN);
  const bandPool = leftoverPool(ctx.profileSlots, poolSorted, 10, 20, LEFT_POOL_MIN);
  ctx.leftGapLookup = rerankGapLookup(keepPoolGapLookup(fullGapLookup, gapPool));
  ctx.leftPoolByBand = buildPoolByBand(bandPool);
  for (let rank = LEFT_BAND_MIN; rank <= LEFT_BAND_MAX; rank++) {
    const targets = buildBandTargetsForRankCascade(flatByWindow, leftBandTier(rank));
    const ladder = buildBandLadderForRankCascade(flatByWindow, leftBandTier(rank));
    if (!targets || !ladder) continue;
    ctx.targetsByRank.set(rank, targets);
    ctx.laddersByRank.set(rank, ladder);
  }
  return { gapPool, bandPool };
};
