import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { appendMissingProfileDiagnostics } from '@/app/recommend/logic/combo/fillMiss';
import { setsInProfileSlotOrder } from '@/app/recommend/logic/combo/orderSets';
import type { CombinationGenerationResult } from '@/app/recommend/logic/combo/genTypes';

export const finishGen = (
  ctx: FillCtx,
  lines: string[],
): CombinationGenerationResult => {
  appendMissingProfileDiagnostics(ctx, lines);
  const sets = setsInProfileSlotOrder(ctx.profileSlots);
  lines.push(`조합 세트: ${sets.length}개 (RANK N=N등 자리대)`);
  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 제약을 확인해 주세요.`
      : null;
  if (warning) lines.push(warning);
  lines.push(`생성 세트 수: ${sets.length}`);
  return { sets, summaryLines: lines, warning };
};
