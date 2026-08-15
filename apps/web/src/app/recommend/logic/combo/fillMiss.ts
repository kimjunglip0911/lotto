import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { FAILURE_REASON_KO } from '@/app/recommend/logic/combo/fillFail';
import { diagnoseProfileBuild, type ProfileConstraints } from '@/app/recommend/logic/repair';

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
    summaryLines.push(`  · ${slot + 1}. rank${rank}: ${profileFailureSummary(ctx, rank) ?? '알 수 없음'}`);
  }
};
