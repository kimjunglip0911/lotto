import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  backtrackBuildOneSet,
  buildOneSetWithFallback,
  flatAdoptedPool,
  isSetWithinUsageLimit,
  buildUnusedPoolSet,
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
  avoidKeys: ReadonlySet<string> = new Set(),
): sorted is number[] =>
  sorted !== null &&
  !usedKeys.has(setKey(sorted)) &&
  !avoidKeys.has(setKey(sorted)) &&
  isSetWithinUsageLimit(sorted, usage);

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
  avoidKeys: ReadonlySet<string> = new Set(),
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = { usage, innerSlotUsage };
  if (bandTargets.length !== 6 || bandLadder.length !== 6) return null;

  if (repairYieldEvery > 0) await yieldToMain();

  const constraints: ProfileConstraints = { minSum, maxSum, bandTargets, bandLadder };
  const blockedKeys =
    avoidKeys.size > 0 ? new Set([...usedKeys, ...avoidKeys]) : usedKeys;

  let sorted = sequentialPickByBands(
    poolByBand,
    bandTargets,
    minSum,
    maxSum,
    pickCtx,
    bandLadder,
  );

  if (!isUsableSet(sorted, usedKeys, usage, avoidKeys)) {
    const nodes = { count: 0 };
    sorted = backtrackBuildOneSet(poolByBand, constraints, pickCtx, 0, [], nodes, blockedKeys);
  }

  if (!isUsableSet(sorted, usedKeys, usage, avoidKeys)) {
    for (let attempt = 0; attempt < PROFILE_BUILD_ATTEMPTS; attempt++) {
      const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, 1);
      if (built && isUsableSet(built.sorted, usedKeys, usage, avoidKeys)) {
        sorted = built.sorted;
        break;
      }
      if (repairYieldEvery > 0) await yieldToMain();
    }
  }

  if (!isUsableSet(sorted, usedKeys, usage, avoidKeys)) {
    const flat = flatAdoptedPool(poolByBand);
    sorted = buildUnusedPoolSet(flat, minSum, maxSum, usage, usedKeys, avoidKeys);
  }

  if (!isUsableSet(sorted, usedKeys, usage, avoidKeys)) return null;

  usedKeys.add(setKey(sorted));
  bumpUsage(sorted, usage, innerSlotUsage);
  return toGeneratedSet(sorted, `combo:rank${rank}`);
};
