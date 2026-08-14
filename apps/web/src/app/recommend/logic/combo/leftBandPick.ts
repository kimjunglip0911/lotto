import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { commitLeftSet } from '@/app/recommend/logic/combo/leftCommit';
import { tryLeftBandSet } from '@/app/recommend/logic/combo/leftBandTry';
import { flatAdoptedPool } from '@/app/recommend/logic/repair/pool';
import { buildUnusedPoolSet } from '@/app/recommend/logic/repair/unusedPool';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover 자리대 세트. 막히면 미사용 풀 조합 */

export const fillLeftBand = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null> => {
  const one = await tryLeftBandSet(ctx, rank, blockedKeys);
  if (one) return one;
  const picked = buildUnusedPoolSet(
    flatAdoptedPool(ctx.leftPoolByBand),
    ctx.minSum,
    ctx.maxSum,
    ctx.usage,
    ctx.usedKeys,
    blockedKeys,
  );
  return picked ? commitLeftSet(ctx, picked, rank) : null;
};
