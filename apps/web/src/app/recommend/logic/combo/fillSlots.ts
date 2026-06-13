import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  diagnoseProfileBuild,
  type ProfileConstraints,
  type ProfileFailureReason,
} from '@/app/recommend/logic/repair';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';

/** 20슬롯(rank 1~20) 채우기·미생성 진단 */

export type FillCtx = {
  poolByBand: ReadonlyMap<number, number[]>;
  minSum: number;
  maxSum: number;
  targetsByRank: Map<number, number[]>;
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
  if (!bandTargets) return FAILURE_REASON_KO.rank_unavailable;
  const constraints: ProfileConstraints = {
    minSum: ctx.minSum,
    maxSum: ctx.maxSum,
    bandTargets,
  };
  const reason = diagnoseProfileBuild(
    ctx.poolByBand,
    constraints,
    ctx.usedKeys,
    { usage: ctx.usage, innerSlotUsage: ctx.innerSlotUsage },
    { allowBacktrack: true, bandTier: rank },
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

export const tryFillOneSlot = async (ctx: FillCtx, slot: number): Promise<boolean> => {
  if (ctx.profileSlots[slot]) return false;
  const rank = COMBO_RANK_SLOT_ORDER[slot];
  if (rank === undefined) return false;
  const bandTargets = ctx.targetsByRank.get(rank);
  if (!bandTargets) return false;

  const one = await findOneSetForRank(
    ctx.poolByBand,
    ctx.minSum,
    ctx.maxSum,
    rank,
    bandTargets,
    ctx.usedKeys,
    ctx.usage,
    ctx.innerSlotUsage,
    ctx.repairYieldEvery,
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
