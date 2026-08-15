import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import {
  bumpUsage,
  releaseGeneratedSet,
  setKey,
  sortedNumsFromSet,
} from '@/app/recommend/logic/combo/toSet';

export const releaseProfileSlot = (ctx: FillCtx, slot: number): void => {
  const set = ctx.profileSlots[slot];
  if (!set) return;
  releaseGeneratedSet(set, ctx.usedKeys, ctx.usage, ctx.innerSlotUsage);
  ctx.profileSlots[slot] = null;
};

export const restoreProfileSlots = (
  ctx: FillCtx,
  fromSlot: number,
  backup: readonly (GeneratedSet | null)[],
): void => {
  for (let i = 0; i < backup.length; i++) {
    const slot = fromSlot + i;
    releaseProfileSlot(ctx, slot);
    const orig = backup[i] ?? null;
    if (!orig) continue;
    ctx.profileSlots[slot] = orig;
    const nums = sortedNumsFromSet(orig);
    bumpUsage(nums, ctx.usage, ctx.innerSlotUsage);
    ctx.usedKeys.add(setKey(nums));
  }
};

export const avoidKeysFromSets = (sets: readonly (GeneratedSet | null)[]): Set<string> => {
  const keys = new Set<string>();
  for (const set of sets) if (set) keys.add(setKey(sortedNumsFromSet(set)));
  return keys;
};

export const highestMissingSlot = (
  slots: readonly (GeneratedSet | null)[],
  minSlot: number,
  maxSlot: number,
): number | null => {
  for (let slot = maxSlot - 1; slot >= minSlot; slot--) {
    if (!slots[slot]) return slot;
  }
  return null;
};
