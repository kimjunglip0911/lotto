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
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import {
  bumpUsage,
  releaseGeneratedSet,
  setKey,
  sortedNumsFromSet,
} from '@/app/recommend/logic/combo/toSet';

/** 20슬롯(rank 1~20) 채우기·미생성 진단 */

export type FillCtx = {
  poolByBand: ReadonlyMap<number, number[]>;
  minSum: number;
  maxSum: number;
  targetsByRank: Map<number, number[]>;
  laddersByRank: Map<number, number[][]>;
  usedKeys: Set<string>;
  usage: Map<number, number>;
  innerSlotUsage: Map<string, number>;
  repairYieldEvery: number;
  profileSlots: (GeneratedSet | null)[];
};

const FAILURE_REASON_KO: Record<ProfileFailureReason, string> = {
  ok: '',
  rank_unavailable: 'rank 통계 부족',
  no_band_in_pool: '채택 풀에 자리 band 후보가 없고, 합만 맞추는 조합도 없음',
  constraints_unsat: '합·자리대를 동시에 맞출 조합 없음(탐색 한도 내)',
  duplicate_only: '조건은 맞지만 이미 만든 6개 번호 조합과 중복',
  usage_limit: `번호가 20세트 전체에서 ${MAX_NUM_USAGE}회 사용 한도에 도달`,
};

const profileFailureSummary = (ctx: FillCtx, rank: number): string | null => {
  const bandTargets = ctx.targetsByRank.get(rank);
  const bandLadder = ctx.laddersByRank.get(rank);
  if (!bandTargets || !bandLadder) return FAILURE_REASON_KO.rank_unavailable;
  const constraints: ProfileConstraints = {
    minSum: ctx.minSum,
    maxSum: ctx.maxSum,
    bandTargets,
    bandLadder,
  };
  const reason = diagnoseProfileBuild(
    ctx.poolByBand,
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
  avoidKeys: ReadonlySet<string> = new Set(),
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
    ctx.repairYieldEvery,
    avoidKeys,
  );
  if (!one) return false;
  ctx.profileSlots[slot] = one;
  return true;
};

export const fillTargetProfiles = async (ctx: FillCtx): Promise<number> => {
  let gained = 0;
  for (let slot = 0; slot < COMBO_RANK_SLOT_ORDER.length; slot++) {
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

const highestMissingSlot = (slots: readonly (GeneratedSet | null)[]): number | null => {
  for (let slot = slots.length - 1; slot >= 0; slot--) {
    if (!slots[slot]) return slot;
  }
  return null;
};

/** rank 19~20 등 후반 미생성: 직전 rank 세트를 되돌리며 다른 조합으로 재시도 */
export const recoverMissingSlots = async (ctx: FillCtx): Promise<number> => {
  let gained = 0;
  for (let attempt = 0; attempt < MAX_SLOT_RECOVERY_ATTEMPTS; attempt++) {
    const missing = highestMissingSlot(ctx.profileSlots);
    if (missing === null) break;

    let recovered = false;
    for (let depth = 1; depth <= MAX_SLOT_RECOVERY_DEPTH; depth++) {
      const start = missing - depth;
      if (start < 0) break;

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
