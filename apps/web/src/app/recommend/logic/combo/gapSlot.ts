import {
  isGapDecadeRank,
  isGapSeqRank,
} from '@/app/recommend/constants/gapSetRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { findDecadeGapSet } from '@/app/recommend/logic/combo/findDecade';
import { findOneGapSetForRank } from '@/app/recommend/logic/combo/findOneGapSet';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** RANK1~10이면 세트, 아니면 undefined */

export const fillGapIfMatch = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null | undefined> => {
  if (isGapSeqRank(rank)) {
    return findOneGapSetForRank(
      rank,
      ctx.gapRankLookup,
      ctx.usedKeys,
      ctx.usage,
      ctx.innerSlotUsage,
      blockedKeys,
      ctx.repairYieldEvery,
    );
  }
  if (isGapDecadeRank(rank)) return findDecadeGapSet(ctx, rank, blockedKeys);
  return undefined;
};
