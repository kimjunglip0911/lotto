import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover 폴백 조합을 슬롯에 반영한다 */

export const commitLeftSet = (
  ctx: FillCtx,
  picked: number[],
  rank: number,
): GeneratedSet => {
  ctx.usedKeys.add(setKey(picked));
  bumpUsage(picked, ctx.usage, ctx.innerSlotUsage);
  return toGeneratedSet(picked, `combo:rank${rank}`);
};
