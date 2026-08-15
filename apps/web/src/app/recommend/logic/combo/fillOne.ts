import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';

const EMPTY_AVOID_KEYS = new Set<string>();

const mergeAvoidKeys = (
  globalKeys: ReadonlySet<string>,
  localKeys: ReadonlySet<string>,
): ReadonlySet<string> => {
  if (globalKeys.size === 0) return localKeys;
  if (localKeys.size === 0) return globalKeys;
  return new Set([...globalKeys, ...localKeys]);
};

export const tryFillOneSlot = async (
  ctx: FillCtx,
  slot: number,
  avoidKeys: ReadonlySet<string> = EMPTY_AVOID_KEYS,
): Promise<boolean> => {
  if (ctx.profileSlots[slot]) return false;
  const rank = COMBO_RANK_SLOT_ORDER[slot];
  if (rank === undefined) return false;
  const bandTargets = ctx.targetsByRank.get(rank);
  const bandLadder = ctx.laddersByRank.get(rank);
  if (!bandTargets || !bandLadder) return false;
  const one = await findOneSetForRank(
    ctx.poolByBand,
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
    mergeAvoidKeys(ctx.pastWinningKeys, avoidKeys),
  );
  if (!one) return false;
  ctx.profileSlots[slot] = one;
  return true;
};
