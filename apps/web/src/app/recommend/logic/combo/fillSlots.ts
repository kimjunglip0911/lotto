import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import {
  MAX_SLOT_RECOVERY_ATTEMPTS,
  MAX_SLOT_RECOVERY_DEPTH,
} from '@/app/recommend/constants/repairLimits';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  diagnoseProfileBuild,
  type ProfileConstraints,
  type ProfileFailureReason,
} from '@/app/recommend/logic/repair';
import {
  isGapSetRank,
  isSectionSetRank,
} from '@/app/recommend/constants/gapSetRanks';
import { isLeftBandRank, isLeftGapRank } from '@/app/recommend/constants/leftRanks';
import {
  isZeroEqualComboRank,
  isZeroEqualGapRank,
  ZERO_EQUAL_GAP_PICK,
} from '@/app/recommend/constants/zeroEqualRanks';
import { findOneGapSetForRank } from '@/app/recommend/logic/combo/findOneGapSet';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import { fillLeftIfMatch } from '@/app/recommend/logic/combo/leftSlot';
import {
  bumpUsage,
  releaseGeneratedSet,
  setKey,
  sortedNumsFromSet,
} from '@/app/recommend/logic/combo/toSet';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';

export type { FillCtx };

const FAILURE_REASON_KO: Record<ProfileFailureReason, string> = {
  ok: '',
  rank_unavailable: 'rank 통계 부족',
  no_band_in_pool: '채택 풀에 자리 band 후보가 없고, 합만 맞추는 조합도 없음',
  constraints_unsat: '합·자리대를 동시에 맞출 조합 없음(탐색 한도 내)',
  duplicate_only: '조건은 맞지만 이미 만든 6개 번호 조합과 중복',
  usage_limit: `번호가 30세트 전체에서 ${MAX_NUM_USAGE}회 사용 한도에 도달`,
};

const EMPTY_AVOID_KEYS = new Set<string>();

const mergeAvoidKeys = (
  globalKeys: ReadonlySet<string>,
  localKeys: ReadonlySet<string>,
): ReadonlySet<string> => {
  if (globalKeys.size === 0) return localKeys;
  if (localKeys.size === 0) return globalKeys;
  return new Set([...globalKeys, ...localKeys]);
};

const profileFailureSummary = (ctx: FillCtx, rank: number): string | null => {
  if (isZeroEqualGapRank(rank) || isGapSetRank(rank) || isLeftGapRank(rank)) {
    const lookup = isZeroEqualGapRank(rank)
      ? ctx.zeroGapRankLookup
      : isLeftGapRank(rank)
        ? ctx.leftGapLookup
        : ctx.gapRankLookup;
    if (lookup.size === 0) {
      return isZeroEqualGapRank(rank)
        ? '균등 0회·간격 후보 없음'
        : isLeftGapRank(rank)
          ? 'leftover 간격 후보 없음'
          : '간격순위 계산 불가';
    }
    return isZeroEqualGapRank(rank)
      ? '균등 0회·간격 조건 미충족'
      : '간격순위·번호 한도·중복 조건 미충족';
  }
  const bandTargets = ctx.targetsByRank.get(rank);
  const bandLadder = ctx.laddersByRank.get(rank);
  if (!bandTargets || !bandLadder) return FAILURE_REASON_KO.rank_unavailable;
  const pool = isZeroEqualComboRank(rank)
    ? ctx.zeroPoolByBand
    : isLeftBandRank(rank)
      ? ctx.leftPoolByBand
      : ctx.poolByBand;
  const constraints: ProfileConstraints = {
    minSum: ctx.minSum,
    maxSum: ctx.maxSum,
    bandTargets,
    bandLadder,
  };
  const reason = diagnoseProfileBuild(
    pool,
    constraints,
    ctx.usedKeys,
    { usage: ctx.usage, innerSlotUsage: ctx.innerSlotUsage },
    { allowBacktrack: true, bandTier: 1 },
  );
  return FAILURE_REASON_KO[reason] || null;
};

export const appendMissingProfileDiagnostics = (
  ctx: FillCtx,
  summaryLines: string[],
): void => {
  const missingSlots: number[] = [];
  for (let slot = 0; slot < COMBO_RANK_SLOT_ORDER.length; slot++) {
    if (!ctx.profileSlots[slot]) missingSlots.push(slot);
  }
  if (missingSlots.length === 0) return;
  summaryLines.push(`최종 미생성 슬롯 ${missingSlots.length}개:`);
  for (const slot of missingSlots) {
    const rank = COMBO_RANK_SLOT_ORDER[slot]!;
    const detail = profileFailureSummary(ctx, rank);
    summaryLines.push(`  · ${slot + 1}. rank${rank}: ${detail ?? '알 수 없음'}`);
  }
};

export const tryFillOneSlot = async (
  ctx: FillCtx,
  slot: number,
  avoidKeys: ReadonlySet<string> = EMPTY_AVOID_KEYS,
): Promise<boolean> => {
  if (ctx.profileSlots[slot]) return false;
  const rank = COMBO_RANK_SLOT_ORDER[slot];
  if (rank === undefined) return false;
  const blockedKeys = mergeAvoidKeys(ctx.pastWinningKeys, avoidKeys);

  const leftover = await fillLeftIfMatch(ctx, rank, blockedKeys);
  if (leftover !== undefined) {
    if (!leftover) return false;
    ctx.profileSlots[slot] = leftover;
    return true;
  }

  if (isZeroEqualGapRank(rank)) {
    const one = await findOneGapSetForRank(
      rank,
      ctx.zeroGapRankLookup,
      ctx.usedKeys,
      ctx.usage,
      ctx.innerSlotUsage,
      blockedKeys,
      ctx.repairYieldEvery,
      ZERO_EQUAL_GAP_PICK,
    );
    if (!one) return false;
    ctx.profileSlots[slot] = one;
    return true;
  }

  if (isGapSetRank(rank)) {
    const one = await findOneGapSetForRank(
      rank,
      ctx.gapRankLookup,
      ctx.usedKeys,
      ctx.usage,
      ctx.innerSlotUsage,
      blockedKeys,
      ctx.repairYieldEvery,
    );
    if (!one) return false;
    ctx.profileSlots[slot] = one;
    return true;
  }

  if (!isSectionSetRank(rank)) return false;
  const bandTargets = ctx.targetsByRank.get(rank);
  const bandLadder = ctx.laddersByRank.get(rank);
  if (!bandTargets || !bandLadder) return false;

  const poolByBand = isZeroEqualComboRank(rank)
    ? ctx.zeroPoolByBand
    : ctx.poolByBand;
  const one = await findOneSetForRank(
    poolByBand,
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
  if (!one) return false;
  ctx.profileSlots[slot] = one;
  return true;
};

export const fillTargetProfiles = async (
  ctx: FillCtx,
  fromSlot = 0,
  toSlot = COMBO_RANK_SLOT_ORDER.length,
): Promise<number> => {
  let gained = 0;
  for (let slot = fromSlot; slot < toSlot; slot++) {
    if (await tryFillOneSlot(ctx, slot)) gained++;
  }
  return gained;
};

const releaseProfileSlot = (ctx: FillCtx, slot: number): void => {
  const set = ctx.profileSlots[slot];
  if (!set) return;
  releaseGeneratedSet(set, ctx.usedKeys, ctx.usage, ctx.innerSlotUsage);
  ctx.profileSlots[slot] = null;
};

const restoreProfileSlots = (
  ctx: FillCtx,
  fromSlot: number,
  backup: readonly (GeneratedSet | null)[],
): void => {
  for (let i = 0; i < backup.length; i++) {
    const slot = fromSlot + i;
    releaseProfileSlot(ctx, slot);
    const orig = backup[i] ?? null;
    if (orig) {
      ctx.profileSlots[slot] = orig;
      bumpUsage(sortedNumsFromSet(orig), ctx.usage, ctx.innerSlotUsage);
      ctx.usedKeys.add(setKey(sortedNumsFromSet(orig)));
    }
  }
};

const highestMissingSlot = (
  slots: readonly (GeneratedSet | null)[],
  minSlot: number,
  maxSlot: number,
): number | null => {
  for (let slot = maxSlot - 1; slot >= minSlot; slot--) {
    if (!slots[slot]) return slot;
  }
  return null;
};

/** 미생성 슬롯 복구: minSlot 아래는 되돌리지 않음 */
export const recoverMissingSlots = async (
  ctx: FillCtx,
  minSlot = 0,
  maxSlot = ctx.profileSlots.length,
): Promise<number> => {
  let gained = 0;
  for (let attempt = 0; attempt < MAX_SLOT_RECOVERY_ATTEMPTS; attempt++) {
    const missing = highestMissingSlot(ctx.profileSlots, minSlot, maxSlot);
    if (missing === null) break;

    let recovered = false;
    for (let depth = 1; depth <= MAX_SLOT_RECOVERY_DEPTH; depth++) {
      const start = missing - depth;
      if (start < minSlot) break;

      const backup = ctx.profileSlots.slice(start, missing);
      const avoidKeys = new Set<string>();
      for (const set of backup) {
        if (set) avoidKeys.add(setKey(sortedNumsFromSet(set)));
      }
      for (let slot = start; slot < missing; slot++) releaseProfileSlot(ctx, slot);

      let ok = true;
      for (let slot = start; slot <= missing; slot++) {
        if (!(await tryFillOneSlot(ctx, slot, avoidKeys))) {
          ok = false;
          break;
        }
      }

      if (ok && ctx.profileSlots[missing]) {
        gained++;
        recovered = true;
        break;
      }

      restoreProfileSlots(ctx, start, backup);
    }

    if (!recovered) break;
  }
  return gained;
};
