import {
  MAX_SLOT_RECOVERY_ATTEMPTS,
  MAX_SLOT_RECOVERY_DEPTH,
} from '@/app/recommend/constants/repairLimits';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { tryFillOneSlot } from '@/app/recommend/logic/combo/fillOne';
import {
  avoidKeysFromSets,
  highestMissingSlot,
  releaseProfileSlot,
  restoreProfileSlots,
} from '@/app/recommend/logic/combo/fillHold';

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
      const avoidKeys = avoidKeysFromSets(backup);
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
