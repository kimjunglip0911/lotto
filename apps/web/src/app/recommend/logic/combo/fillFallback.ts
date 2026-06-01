import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import type { AdoptReservePools } from '@/app/recommend/logic/adopt/adoptTypes';
import type { FillCtx } from '@/app/recommend/logic/combo/fillSlots';
import { formatProfileTriple } from '@/app/recommend/logic/combo/orderSets';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { sortPickedAsc } from '@/app/recommend/logic/repair';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 2단계: 빈 슬롯을 합·홀짝·연속·band 무시 조합으로 채움 */

export type FallbackFillResult = {
  filled: number;
  accuAdded: number;
  chiAdded: number;
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

const addNumsToPool = (
  activePool: number[],
  activeSet: Set<number>,
  usage: Map<number, number>,
  nums: readonly number[],
): number => {
  let added = 0;
  for (const n of nums) {
    if (activeSet.has(n)) continue;
    activeSet.add(n);
    activePool.push(n);
    if (!usage.has(n)) usage.set(n, 0);
    added++;
  }
  return added;
};

export const fillFallbackSlots = (
  ctx: FillCtx,
  poolSorted: readonly number[],
  reservePools: AdoptReservePools,
): FallbackFillResult => {
  let filled = 0;
  const activePool = [...poolSorted];
  const activeSet = new Set(activePool);
  const accuAdded = addNumsToPool(
    activePool,
    activeSet,
    ctx.usage,
    reservePools.accumulatedExcluded,
  );
  const chiAdded = addNumsToPool(
    activePool,
    activeSet,
    ctx.usage,
    reservePools.chiExcludedByPct,
  );

  for (let slot = 0; slot < COMBO_PROFILE_SLOT_ORDER.length; slot++) {
    if (ctx.profileSlots[slot]) continue;
    const triple = COMBO_PROFILE_SLOT_ORDER[slot];
    if (!triple) continue;
    const [oe, run, band] = triple;

    const sorted = findFallbackSetBacktrack(activePool, ctx.usage, ctx.usedKeys);
    if (!sorted) continue;

    const strategy = `${FALLBACK_STRATEGY_PREFIX}${formatProfileTriple(oe, run, band)}`;
    ctx.usedKeys.add(setKey(sorted));
    bumpUsage(sorted, ctx.usage, ctx.innerSlotUsage);
    ctx.profileSlots[slot] = toGeneratedSet(sorted, strategy);
    filled++;
  }

  return { filled, accuAdded, chiAdded, expandedPoolSize: activeSet.size };
};
