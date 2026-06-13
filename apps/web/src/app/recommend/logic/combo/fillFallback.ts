import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import type { FillCtx } from '@/app/recommend/logic/combo/fillSlots';
import { formatProfilePair } from '@/app/recommend/logic/combo/orderSets';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { sortPickedAsc } from '@/app/recommend/logic/repair';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 2단계: 빈 슬롯을 합·홀짝·band 무시 조합으로 채움 */

export type FallbackFillResult = {
  filled: number;
  expandedPoolSize: number;
};

/** usage·중복만 지키며 6개 조합을 백트래킹으로 찾는다 */

export const findFallbackSetBacktrack = (
  pool: readonly number[],
  usage: ReadonlyMap<number, number>,
  usedKeys: ReadonlySet<string>,
): number[] | null => {
  const avail = filterUsageAvail([...pool], usage);
  if (avail.length < 6) return null;

  const search = (from: number, picked: number[]): number[] | null => {
    if (picked.length === 6) {
      const sorted = sortPickedAsc(picked);
      if (usedKeys.has(setKey(sorted))) return null;
      return sorted;
    }
    for (let i = from; i < avail.length; i++) {
      picked.push(avail[i]!);
      const found = search(i + 1, picked);
      if (found) return found;
      picked.pop();
    }
    return null;
  };
  return search(0, []);
};

export const fillFallbackSlots = (
  ctx: FillCtx,
  poolSorted: readonly number[],
): FallbackFillResult => {
  let filled = 0;
  const activeSet = new Set(poolSorted);

  for (let slot = 0; slot < COMBO_PROFILE_SLOT_ORDER.length; slot++) {
    if (ctx.profileSlots[slot]) continue;
    const pair = COMBO_PROFILE_SLOT_ORDER[slot];
    if (!pair) continue;
    const [oe, band] = pair;

    const sorted = findFallbackSetBacktrack(poolSorted, ctx.usage, ctx.usedKeys);
    if (!sorted) continue;

    const strategy = `${FALLBACK_STRATEGY_PREFIX}${formatProfilePair(oe, band)}`;
    ctx.usedKeys.add(setKey(sorted));
    bumpUsage(sorted, ctx.usage, ctx.innerSlotUsage);
    ctx.profileSlots[slot] = toGeneratedSet(sorted, strategy);
    filled++;
  }

  return { filled, expandedPoolSize: activeSet.size };
};
