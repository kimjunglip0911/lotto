import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { AdoptReservePools } from '@/app/recommend/logic/adopt/adoptTypes';
import type { FillCtx } from '@/app/recommend/logic/combo/fillSlots';
import { formatProfileTriple } from '@/app/recommend/logic/combo/orderSets';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { isSetWithinUsageLimit, sortPickedAsc } from '@/app/recommend/logic/repair';
import { pickSixFromFlatPool } from '@/app/recommend/logic/repair/pick';

/** 2단계: 빈 슬롯을 합·홀짝·연속·band 무시 조합으로 채움 */

export type FallbackFillResult = {
  filled: number;
  accuAdded: number;
  chiAdded: number;
  expandedPoolSize: number;
};

const randomPickOne = (candidates: readonly number[]): number | null => {
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
};

const tryPickFallbackOnce = (
  activePool: readonly number[],
  usage: ReadonlyMap<number, number>,
  usedKeys: ReadonlySet<string>,
): number[] | null => {
  const pickCtx = { usage };
  for (let i = 0; i < PROFILE_BUILD_ATTEMPTS; i++) {
    const picked = pickSixFromFlatPool(activePool, pickCtx);
    if (!picked) continue;
    const sorted = sortPickedAsc(picked);
    const key = setKey(sorted);
    if (usedKeys.has(key)) continue;
    if (!isSetWithinUsageLimit(sorted, usage)) continue;
    return sorted;
  }
  return null;
};

const pullRandomIntoPool = (
  activePool: number[],
  activeSet: Set<number>,
  usage: Map<number, number>,
  remaining: number[],
): number | null => {
  const pick = randomPickOne(remaining);
  if (pick === null) return null;
  remaining.splice(remaining.indexOf(pick), 1);
  if (!activeSet.has(pick)) {
    activeSet.add(pick);
    activePool.push(pick);
    if (!usage.has(pick)) usage.set(pick, 0);
    return pick;
  }
  return null;
};

export const fillFallbackSlots = (
  ctx: FillCtx,
  poolSorted: readonly number[],
  reservePools: AdoptReservePools,
): FallbackFillResult => {
  let filled = 0;
  let accuAdded = 0;
  let chiAdded = 0;
  const activePool = [...poolSorted];
  const activeSet = new Set(activePool);
  const accuRemaining = reservePools.accumulatedExcluded.filter((n) => !activeSet.has(n));
  const chiRemaining = reservePools.chiExcludedByPct.filter((n) => !activeSet.has(n));

  for (let slot = 0; slot < COMBO_PROFILE_SLOT_ORDER.length; slot++) {
    if (ctx.profileSlots[slot]) continue;
    const triple = COMBO_PROFILE_SLOT_ORDER[slot];
    if (!triple) continue;
    const [oe, run, band] = triple;

    let sorted = tryPickFallbackOnce(activePool, ctx.usage, ctx.usedKeys);

    while (!sorted && accuRemaining.length > 0) {
      if (pullRandomIntoPool(activePool, activeSet, ctx.usage, accuRemaining) !== null) {
        accuAdded++;
      }
      sorted = tryPickFallbackOnce(activePool, ctx.usage, ctx.usedKeys);
    }

    while (!sorted && chiRemaining.length > 0) {
      if (pullRandomIntoPool(activePool, activeSet, ctx.usage, chiRemaining) !== null) {
        chiAdded++;
      }
      sorted = tryPickFallbackOnce(activePool, ctx.usage, ctx.usedKeys);
    }

    if (!sorted) continue;

    const strategy = `${FALLBACK_STRATEGY_PREFIX}${formatProfileTriple(oe, run, band)}`;
    ctx.usedKeys.add(setKey(sorted));
    bumpUsage(sorted, ctx.usage, ctx.innerSlotUsage);
    ctx.profileSlots[slot] = toGeneratedSet(sorted, strategy);
    filled++;
  }

  return { filled, accuAdded, chiAdded, expandedPoolSize: activeSet.size };
};
