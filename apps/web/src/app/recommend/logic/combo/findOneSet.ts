import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import { TAIL_UNUSED_RANK_START } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  backtrackBuildOneSet,
  buildOneSetWithFallback,
  flatAdoptedPool,
  isSetWithinUsageLimit,
  buildUnusedPoolSet,
  buildTailUnusedSet,
  type ProfileConstraints,
  type RepairPickCtx,
} from '@/app/recommend/logic/repair';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';

/** 한 rank 프로필에 맞는 세트 1개(기존 조합·번호 한도와 중복되지 않음) */

const isUsableSet = (
  sorted: number[] | null,
  usedKeys: ReadonlySet<string>,
  usage: ReadonlyMap<number, number>,
): sorted is number[] =>
  sorted !== null && !usedKeys.has(setKey(sorted)) && isSetWithinUsageLimit(sorted, usage);

export const findOneSetForRank = async (
  poolByBand: ReadonlyMap<number, number[]>,
  minSum: number,
  maxSum: number,
  rank: number,
  bandTargets: readonly number[],
  bandLadder: readonly (readonly number[])[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery: number,
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage };
  if (bandTargets.length !== 6 || bandLadder.length !== 6) return null;

  if (repairYieldEvery > 0) await yieldToMain();

  if (rank >= TAIL_UNUSED_RANK_START) {
    const flat = flatAdoptedPool(poolByBand);
    const sorted = buildTailUnusedSet(flat, usage, usedKeys);
    if (!isUsableSet(sorted, usedKeys, usage)) return null;
    usedKeys.add(setKey(sorted));
    bumpUsage(sorted, usage, innerSlotUsage);
    return toGeneratedSet(sorted, `combo:rank${rank}`);
  }

  const constraints: ProfileConstraints = { minSum, maxSum, bandTargets, bandLadder };

  let sorted = sequentialPickByBands(
    poolByBand,
    bandTargets,
    minSum,
    maxSum,
    pickCtx,
    bandLadder,
  );

  if (!isUsableSet(sorted, usedKeys, usage)) {
    const nodes = { count: 0 };
    sorted = backtrackBuildOneSet(poolByBand, constraints, pickCtx, 0, [], nodes, usedKeys);
  }

  if (!isUsableSet(sorted, usedKeys, usage)) {
    for (let attempt = 0; attempt < PROFILE_BUILD_ATTEMPTS; attempt++) {
      const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, 1);
      if (built && isUsableSet(built.sorted, usedKeys, usage)) {
        sorted = built.sorted;
        break;
      }
      if (repairYieldEvery > 0) await yieldToMain();
    }
  }

  if (!isUsableSet(sorted, usedKeys, usage)) {
    const flat = flatAdoptedPool(poolByBand);
    sorted = buildUnusedPoolSet(flat, minSum, maxSum, usage, usedKeys);
  }

  if (!isUsableSet(sorted, usedKeys, usage)) return null;

  usedKeys.add(setKey(sorted));
  bumpUsage(sorted, usage, innerSlotUsage);
  return toGeneratedSet(sorted, `combo:rank${rank}`);
};
