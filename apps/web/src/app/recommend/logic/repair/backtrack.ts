import { MAX_BACKTRACK_NODES } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { diverseCandidateOrder } from '@/app/recommend/logic/repair/diverse';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';

const MAX_BACKTRACK_CANDS_PER_POS = 9;

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
  const candidates = diverseCandidateOrder(
    (poolByBand.get(band) ?? []).filter((n) => !used.has(n)),
    pickCtx,
  ).slice(0, MAX_BACKTRACK_CANDS_PER_POS);
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
): number[] | null => {
  if (nodes.count >= MAX_BACKTRACK_NODES) return null;
  nodes.count++;
  if (pos === 6) {
    const state = validatePickedSet(picked, constraints);
    return state.ok ? sortPickedAsc(picked) : null;
  }
  const band = constraints.bandTargets[pos]!;
  const used = new Set(picked);
  const candidates = diverseCandidateOrder(
    (poolByBand.get(band) ?? []).filter((n) => !used.has(n)),
    pickCtx,
  ).slice(0, MAX_BACKTRACK_CANDS_PER_POS);
  if (candidates.length === 0) return null;
  for (const n of candidates) {
    picked.push(n);
    const found = backtrackBuildOneSet(poolByBand, constraints, pickCtx, pos + 1, picked, nodes);
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
