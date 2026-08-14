import { GAP_REV_MIN } from '@/app/recommend/constants/gapSetRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { commitLeftSet } from '@/app/recommend/logic/combo/leftCommit';
import { numsUsedInSlots } from '@/app/recommend/logic/combo/leftPool';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';
import { pickRevGapNumbers } from '@/app/recommend/logic/gap/pickRevGap';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** RANK6~10: 45등부터 역순. 그룹 안 번호 중복 없음 */

export const findRevGapSet = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null> => {
  if (ctx.repairYieldEvery > 0) await yieldToMain();
  const taken = numsUsedInSlots(ctx.profileSlots, GAP_REV_MIN - 1, rank - 1);
  const picked = pickRevGapNumbers(
    rank,
    ctx.gapRankLookup,
    taken,
    ctx.usage,
  );
  if (!picked) return null;
  if (ctx.usedKeys.has(setKey(picked)) || blockedKeys.has(setKey(picked))) {
    return null;
  }
  return commitLeftSet(ctx, picked, rank);
};
