import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover 자리대 목표로 세트 1개를 시도한다 */

export const tryLeftBandSet = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null> => {
  const targets = ctx.targetsByRank.get(rank);
  const ladder = ctx.laddersByRank.get(rank);
  if (!targets || !ladder) return null;
  return findOneSetForRank(
    ctx.leftPoolByBand,
    ctx.minSum,
    ctx.maxSum,
    rank,
    targets,
    ladder,
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
