import {
  isGapRevRank,
  isGapSeqRank,
} from '@/app/recommend/constants/gapSetRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { findOneGapSetForRank } from '@/app/recommend/logic/combo/findOneGapSet';
import { findRevGapSet } from '@/app/recommend/logic/combo/findRevGap';
import { numsUsedInSlots } from '@/app/recommend/logic/combo/leftPool';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** RANK1~10이면 세트, 아니면 undefined */

export const fillGapIfMatch = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null | undefined> => {
  if (isGapSeqRank(rank)) {
    const taken = numsUsedInSlots(ctx.profileSlots, 0, rank - 1);
    return findOneGapSetForRank(
      rank,
      ctx.gapRankLookup,
      ctx.usedKeys,
      ctx.usage,
      ctx.innerSlotUsage,
      blockedKeys,
      ctx.repairYieldEvery,
      rank,
      undefined,
      taken,
    );
  }
  if (isGapRevRank(rank)) return findRevGapSet(ctx, rank, blockedKeys);
  return undefined;
};
