import {
  isLeftBandRank,
  isLeftGapRank,
  leftGapStartRank,
} from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { findOneGapSetForRank } from '@/app/recommend/logic/combo/findOneGapSet';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover면 세트, 아니면 undefined */
export const fillLeftIfMatch = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null | undefined> => {
  if (isLeftGapRank(rank)) {
    return findOneGapSetForRank(
      rank,
      ctx.leftGapLookup,
      ctx.usedKeys,
      ctx.usage,
      ctx.innerSlotUsage,
      blockedKeys,
      ctx.repairYieldEvery,
      rank,
      leftGapStartRank(rank),
    );
  }
  if (!isLeftBandRank(rank)) return undefined;
  const bandTargets = ctx.targetsByRank.get(rank);
  const bandLadder = ctx.laddersByRank.get(rank);
  if (!bandTargets || !bandLadder) return null;
  return findOneSetForRank(
    ctx.leftPoolByBand,
    ctx.minSum,
    ctx.maxSum,
    rank,
    bandTargets,
    bandLadder,
    ctx.usedKeys,
    ctx.usage,
    ctx.innerSlotUsage,
    ctx.histCounts,
    ctx.positionRankLookup,
    ctx.positionDrawCountLookup,
    ctx.repairYieldEvery,
    blockedKeys,
    new Map(),
  );
};
