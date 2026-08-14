import { leftGapStartRank } from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { findOneGapSetForRank } from '@/app/recommend/logic/combo/findOneGapSet';
import { commitLeftSet } from '@/app/recommend/logic/combo/leftCommit';
import { nextSixCombo } from '@/app/recommend/logic/combo/nextSix';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover 간격 세트. 막히면 다음 6조합 */

export const fillLeftGap = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null> => {
  const one = await findOneGapSetForRank(
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
  if (one) return one;
  const nums = [...ctx.leftGapLookup.values()]
    .sort((a, b) => a.rank - b.rank || a.number - b.number)
    .map((row) => row.number);
  const picked = nextSixCombo(nums, new Set([...ctx.usedKeys, ...blockedKeys]));
  return picked ? commitLeftSet(ctx, picked, rank) : null;
};
