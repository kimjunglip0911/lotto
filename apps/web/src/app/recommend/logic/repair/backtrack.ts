import { MAX_BACKTRACK_NODES } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { bandRungsForPos, collectBandCands } from '@/app/recommend/logic/repair/bandFallback';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { nudgeDuplicateCombo } from '@/app/recommend/logic/repair/nudgeDuplicate';
import { isSetWithinUsageLimit } from '@/app/recommend/logic/repair/usageLimit';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';

const MAX_BACKTRACK_CANDS_PER_POS = 9;

const setKeyFromSorted = (nums: readonly number[]): string => setKey([...nums]);

const candsForPos = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
  pos: number,
  picked: number[],
): number[] => {
  const used = new Set(picked);
  const rungs = bandRungsForPos(pos, constraints.bandTargets, constraints.bandLadder);
  const seen = new Set<number>();
  const merged: number[] = [];
  for (const band of rungs) {
    for (const n of collectBandCands(poolByBand, band, used, pickCtx)) {
      if (seen.has(n)) continue;
      seen.add(n);
      merged.push(n);
      if (merged.length >= MAX_BACKTRACK_CANDS_PER_POS) return merged;
    }
  }
  return merged;
};

/** band 골격·전체 제약 백트래킹 */

export const backtrackPositionPicks = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
  pos: number,
  picked: number[],
  nodes: { count: number },
): number[] | null => {
  if (nodes.count >= MAX_BACKTRACK_NODES) return null;
  nodes.count++;
  if (pos === 6) return [...picked];
  const band = bandTargets[pos]!;
  const used = new Set(picked);
  const candidates = collectBandCands(poolByBand, band, used, pickCtx).slice(
    0,
    MAX_BACKTRACK_CANDS_PER_POS,
  );
  if (candidates.length === 0) return null;
  for (const n of candidates) {
    picked.push(n);
    const found = backtrackPositionPicks(poolByBand, bandTargets, pickCtx, pos + 1, picked, nodes);
    if (found) return found;
    picked.pop();
  }
  return null;
};

export const backtrackBuildOneSet = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
  pos: number,
  picked: number[],
  nodes: { count: number },
  usedKeys: ReadonlySet<string> = new Set(),
): number[] | null => {
  if (nodes.count >= MAX_BACKTRACK_NODES) return null;
  nodes.count++;
  if (pos === 6) {
    const state = validatePickedSet(picked, constraints);
    if (!state.ok) return null;
    if (!isSetWithinUsageLimit(picked, pickCtx.usage)) return null;
    if (usedKeys.has(setKeyFromSorted(picked))) {
      return nudgeDuplicateCombo(picked, constraints, poolByBand, pickCtx, usedKeys);
    }
    return [...picked];
  }
  const candidates = candsForPos(poolByBand, constraints, pickCtx, pos, picked);
  if (candidates.length === 0) return null;
  for (const n of candidates) {
    picked.push(n);
    const found = backtrackBuildOneSet(
      poolByBand,
      constraints,
      pickCtx,
      pos + 1,
      picked,
      nodes,
      usedKeys,
    );
    if (found) return found;
    picked.pop();
  }
  return null;
};

export const canPickBandSkeleton = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
): boolean => {
  if (bandTargets.length !== 6) return false;
  const nodes = { count: 0 };
  return backtrackPositionPicks(poolByBand, bandTargets, pickCtx, 0, [], nodes) !== null;
};
