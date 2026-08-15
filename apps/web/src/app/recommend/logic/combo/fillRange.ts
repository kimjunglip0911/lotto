import { MAX_PRIORITY_ROUNDS } from '@/app/recommend/logic/combo/yieldMain';
import { recoverMissingSlots } from '@/app/recommend/logic/combo/fillBack';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { fillTargetProfiles } from '@/app/recommend/logic/combo/fillSlots';

/** 슬롯 구간만 채우고, 같은 구간만 복구한다 */

export const fillSlotRange = async (
  ctx: FillCtx,
  fromSlot: number,
  toSlot: number,
): Promise<void> => {
  for (let round = 0; round < MAX_PRIORITY_ROUNDS; round++) {
    const gained = await fillTargetProfiles(ctx, fromSlot, toSlot);
    if (gained === 0) break;
    if (ctx.profileSlots.slice(fromSlot, toSlot).every((s) => s !== null)) break;
  }
  if (ctx.profileSlots.slice(fromSlot, toSlot).some((s) => s === null)) {
    await recoverMissingSlots(ctx, fromSlot, toSlot);
  }
};
