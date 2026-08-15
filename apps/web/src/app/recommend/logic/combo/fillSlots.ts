import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { tryFillOneSlot } from '@/app/recommend/logic/combo/fillOne';

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
