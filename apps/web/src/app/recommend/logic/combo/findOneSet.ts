import { buildConsecutiveRunDistribution } from '@/app/analysis/combination/logic/buildConsecutiveRunDistribution';
import { buildOddEvenDistribution } from '@/app/analysis/combination/logic/buildOddEvenDistribution';
import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  buildMetricsOnlyFromPool,
  buildOneSetWithFallback,
  randomPerPositionPick,
  sortPickedAsc,
  type ProfileConstraints,
  type RepairPickCtx,
} from '@/app/recommend/logic/repair';
import { evenCountAtRank, maxRunAtRank } from '@/app/recommend/logic/combo/rankAtPct';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';

/** 한 프로필(oe·run·band)에 맞는 세트 1개 */

export const findOneSetForRanks = async (
  poolByBand: ReadonlyMap<number, number[]>,
  minSum: number,
  maxSum: number,
  oddRank: number,
  consecRank: number,
  bandTier: number,
  oddRows: ReturnType<typeof buildOddEvenDistribution>['rows'],
  consecRows: ReturnType<typeof buildConsecutiveRunDistribution>['rows'],
  bandTargets: readonly number[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage };
  const evenT = evenCountAtRank(oddRows, oddRank);
  const runT = maxRunAtRank(consecRows, consecRank);
  if (evenT === null || runT === null) return null;
  if (bandTargets.length !== 6) return null;

  const constraints: ProfileConstraints = { minSum, maxSum, evenT, runT, bandTargets };
  if (repairYieldEvery > 0) await yieldToMain();

  const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, PROFILE_BUILD_ATTEMPTS);
  if (!built) return null;

  const baseStrategy = `combo:oe${oddRank}-run${consecRank}-band${bandTier}`;
  let sorted = built.sorted;
  let key = setKey(sorted);
  if (usedKeys.has(key)) {
    for (let i = 0; i < PROFILE_BUILD_ATTEMPTS; i++) {
      const picked = randomPerPositionPick(poolByBand, bandTargets, pickCtx);
      if (!picked) continue;
      sorted = sortPickedAsc(picked);
      key = setKey(sorted);
      if (!usedKeys.has(key)) break;
    }
    if (usedKeys.has(key)) {
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
    if (usedKeys.has(key)) return null;
  }

  usedKeys.add(key);
  bumpUsage(sorted, usage, innerSlotUsage);
  return toGeneratedSet(sorted, baseStrategy);
};
