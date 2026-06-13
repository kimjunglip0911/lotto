import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  buildOneSetWithFallback,
  isSetWithinUsageLimit,
  type ProfileConstraints,
  type RepairPickCtx,
} from '@/app/recommend/logic/repair';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';

/** 한 rank 프로필에 맞는 세트 1개 */

export const findOneSetForRank = async (
  poolByBand: ReadonlyMap<number, number[]>,
  minSum: number,
  maxSum: number,
  rank: number,
  bandTargets: readonly number[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage };
  if (bandTargets.length !== 6) return null;

  const constraints: ProfileConstraints = { minSum, maxSum, bandTargets };
  if (repairYieldEvery > 0) await yieldToMain();

  let sorted = sequentialPickByBands(poolByBand, bandTargets, minSum, maxSum, pickCtx);

  if (!sorted) {
    const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, PROFILE_BUILD_ATTEMPTS);
    if (!built) return null;
    sorted = built.sorted;
  }

  const key = setKey(sorted);
  if (usedKeys.has(key) || !isSetWithinUsageLimit(sorted, usage)) return null;

  usedKeys.add(key);
  bumpUsage(sorted, usage, innerSlotUsage);
  return toGeneratedSet(sorted, `combo:rank${rank}`);
};
