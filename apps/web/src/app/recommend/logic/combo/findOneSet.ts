import { buildOddEvenDistribution } from '@/app/analysis/combination/logic/buildOddEvenDistribution';
import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  buildMetricsOnlyFromPool,
  buildOneSetWithFallback,
  isSetWithinUsageLimit,
  randomPerPositionPick,
  sortPickedAsc,
  type ProfileConstraints,
  type RepairPickCtx,
} from '@/app/recommend/logic/repair';
import { evenCountAtRank } from '@/app/recommend/logic/combo/rankAtPct';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';

/** 한 프로필(oe·band)에 맞는 세트 1개 */

export const findOneSetForRanks = async (
  poolByBand: ReadonlyMap<number, number[]>,
  minSum: number,
  maxSum: number,
  oddRank: number,
  bandTier: number,
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  bandTargets: readonly number[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage };
  const evenT = evenCountAtRank(oddRows, oddRank);
  if (evenT === null) return null;
  if (bandTargets.length !== 6) return null;

  const constraints: ProfileConstraints = { minSum, maxSum, evenT, bandTargets };
  if (repairYieldEvery > 0) await yieldToMain();

  const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, PROFILE_BUILD_ATTEMPTS);
  if (!built) return null;

  const baseStrategy = `combo:oe${oddRank}-band${bandTier}`;
  let sorted = built.sorted;
  let key = setKey(sorted);

  const canAccept = (nums: readonly number[], setKeyVal: string): boolean =>
    !usedKeys.has(setKeyVal) && isSetWithinUsageLimit(nums, usage);

  if (!canAccept(sorted, key)) {
    for (let i = 0; i < PROFILE_BUILD_ATTEMPTS; i++) {
      const picked = randomPerPositionPick(poolByBand, bandTargets, pickCtx);
      if (!picked) continue;
      sorted = sortPickedAsc(picked);
      key = setKey(sorted);
      if (canAccept(sorted, key)) break;
    }
    if (!canAccept(sorted, key)) {
      const metrics = buildMetricsOnlyFromPool(
        poolByBand,
        constraints,
        pickCtx,
        PROFILE_BUILD_ATTEMPTS,
      );
      if (metrics) {
        sorted = metrics;
        key = setKey(sorted);
      }
    }
    if (!canAccept(sorted, key)) return null;
  }

  usedKeys.add(key);
  bumpUsage(sorted, usage, innerSlotUsage);
  return toGeneratedSet(sorted, baseStrategy);
};
