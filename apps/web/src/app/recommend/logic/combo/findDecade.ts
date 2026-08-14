import { decadeQuota } from '@/app/recommend/constants/decadeQuota';
import { GAP_DECADE_MIN } from '@/app/recommend/constants/gapSetRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { commitLeftSet } from '@/app/recommend/logic/combo/leftCommit';
import { numsUsedInSlots } from '@/app/recommend/logic/combo/leftPool';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';
import { pickDecadeGapNumbers } from '@/app/recommend/logic/gap/pickDecade';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** RANK6~10: 번호대 칸. 5세트 안에서는 번호 중복 없음 */

export const findDecadeGapSet = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null> => {
  if (ctx.repairYieldEvery > 0) await yieldToMain();
  const quota = decadeQuota(rank);
  if (!quota) return null;
  const taken = numsUsedInSlots(ctx.profileSlots, GAP_DECADE_MIN - 1, rank - 1);
  const picked = pickDecadeGapNumbers(
    ctx.gapRankLookup,
    quota,
    taken,
    ctx.usage,
  );
  if (!picked) return null;
  if (ctx.usedKeys.has(setKey(picked)) || blockedKeys.has(setKey(picked))) {
    return null;
  }
  return commitLeftSet(ctx, picked, rank);
};
