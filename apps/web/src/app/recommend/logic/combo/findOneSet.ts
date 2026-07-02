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
import { nudgeDuplicateCombo } from '@/app/recommend/logic/repair/nudgeDuplicate';
import { isOneNumberSetDiff } from '@/app/recommend/logic/repair/nudgeSwap';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';
import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';
import type {
  PositionDrawCountLookup,
  PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 한 rank 프로필에 맞는 세트 1개(기존 조합·번호 한도와 중복되지 않음) */

const isUsableSet = (
  picked: number[] | null,
  usedKeys: ReadonlySet<string>,
  usage: ReadonlyMap<number, number>,
  avoidKeys: ReadonlySet<string> = new Set(),
): picked is number[] =>
  picked !== null &&
  !usedKeys.has(setKey(picked)) &&
  !avoidKeys.has(setKey(picked)) &&
  isSetWithinUsageLimit(picked, usage);

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
  histCounts: readonly number[],
  positionRankLookup: PositionRankLookup,
  positionDrawCountLookup: PositionDrawCountLookup,
  repairYieldEvery: number,
  avoidKeys: ReadonlySet<string> = new Set(),
  gapRankLookup: GapRankLookup = new Map(),
): Promise<GeneratedSet | null> => {
  const pickCtx: RepairPickCtx = {
    usage,
    innerSlotUsage,
    histCounts,
    positionRankLookup,
    positionDrawCountLookup,
    gapRankLookup,
  };
  if (bandTargets.length !== 6 || bandLadder.length !== 6) return null;

  if (repairYieldEvery > 0) await yieldToMain();

  const constraints: ProfileConstraints = { minSum, maxSum, bandTargets, bandLadder };
  const blockedKeys =
    avoidKeys.size > 0 ? new Set([...usedKeys, ...avoidKeys]) : usedKeys;

  const baseFromSequential = sequentialPickByBands(
    poolByBand,
    bandTargets,
    minSum,
    maxSum,
    pickCtx,
    bandLadder,
  );

  const isDuplicateBlocked = (nums: readonly number[]): boolean =>
    usedKeys.has(setKey([...nums])) || avoidKeys.has(setKey([...nums]));

  let picked: number[] | null = baseFromSequential;
  const wasDuplicate =
    baseFromSequential !== null && isDuplicateBlocked(baseFromSequential);

  if (wasDuplicate && baseFromSequential) {
    picked = nudgeDuplicateCombo(
      baseFromSequential,
      constraints,
      poolByBand,
      pickCtx,
      blockedKeys,
    );
  }

  if (!isUsableSet(picked, usedKeys, usage, avoidKeys) && !wasDuplicate) {
    const nodes = { count: 0 };
    picked = backtrackBuildOneSet(poolByBand, constraints, pickCtx, 0, [], nodes, blockedKeys);
  }

  if (!isUsableSet(picked, usedKeys, usage, avoidKeys)) {
    for (let attempt = 0; attempt < PROFILE_BUILD_ATTEMPTS; attempt++) {
      const built = buildOneSetWithFallback(poolByBand, constraints, pickCtx, 1);
      if (
        built &&
        isUsableSet(built.picked, usedKeys, usage, avoidKeys) &&
        (!wasDuplicate ||
          !baseFromSequential ||
          isOneNumberSetDiff(baseFromSequential, built.picked))
      ) {
        picked = built.picked;
        break;
      }
      if (repairYieldEvery > 0) await yieldToMain();
    }
  }

  if (!isUsableSet(picked, usedKeys, usage, avoidKeys) && !wasDuplicate) {
    const flat = flatAdoptedPool(poolByBand);
    picked = buildUnusedPoolSet(flat, minSum, maxSum, usage, usedKeys, avoidKeys);
  }

  if (!isUsableSet(picked, usedKeys, usage, avoidKeys)) return null;

  usedKeys.add(setKey(picked));
  bumpUsage(picked, usage, innerSlotUsage);
  return toGeneratedSet(picked, `combo:rank${rank}`);
};
