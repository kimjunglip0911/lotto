import {
  HEAVY_SEARCH_MAX_POOL,
  MAX_BFS_REPAIR_VISITS,
  MAX_SEED_ATTEMPTS,
} from '@/app/recommend/constants/repairLimits';
import type { ForceBuildOptions, ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { adoptedPoolSize } from '@/app/recommend/logic/repair/pool';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { backtrackPositionPicks, backtrackBuildOneSet } from '@/app/recommend/logic/repair/backtrack';
import { randomPerPositionPick } from '@/app/recommend/logic/repair/pick';
import { tryBuildOneSet } from '@/app/recommend/logic/repair/tryBuild';
import { aggressiveRepairUntilOk, bfsRepairUntilOk, stochasticRepairUntilOk } from '@/app/recommend/logic/repair/search';

/** 백트래킹·BFS로 강제 생성 */

export const forceBuildOneSet = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx = {},
  options?: ForceBuildOptions,
): number[] | null => {
  const allowBacktrack = options?.allowBacktrack !== false;
  const bandTier = options?.bandTier ?? 0;
  const heavySearch = adoptedPoolSize(poolByBand) <= HEAVY_SEARCH_MAX_POOL || bandTier >= 3;

  const quick = tryBuildOneSet(poolByBand, constraints, pickCtx);
  if (quick) return quick;

  const seedAttempts = heavySearch ? MAX_SEED_ATTEMPTS : 20;

  for (let attempt = 0; attempt < seedAttempts; attempt++) {
    const picked = randomPerPositionPick(
      poolByBand,
      constraints.bandTargets,
      pickCtx,
      constraints.bandLadder,
    );
    if (!picked) continue;
    const work = [...picked];
    if (aggressiveRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work);
    }
    if (heavySearch && stochasticRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work);
    }
  }

  if (!allowBacktrack || !heavySearch) return null;

  const bfsCap = MAX_BFS_REPAIR_VISITS;
  const nodesBand = { count: 0 };
  const bandSkeleton = backtrackPositionPicks(
    poolByBand,
    constraints.bandTargets,
    pickCtx,
    0,
    [],
    nodesBand,
  );
  if (bandSkeleton) {
    const work = [...bandSkeleton];
    if (aggressiveRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work);
    }
    const bfs = bfsRepairUntilOk(work, constraints, poolByBand, pickCtx, bfsCap);
    if (bfs) return bfs;
    if (stochasticRepairUntilOk(work, constraints, poolByBand, pickCtx)) {
      return sortPickedAsc(work);
    }
  }

  const seed = randomPerPositionPick(
    poolByBand,
    constraints.bandTargets,
    pickCtx,
    constraints.bandLadder,
  );
  if (seed) {
    const bfs = bfsRepairUntilOk(seed, constraints, poolByBand, pickCtx, bfsCap);
    if (bfs) return bfs;
  }

  const nodesFull = { count: 0 };
  return backtrackBuildOneSet(poolByBand, constraints, pickCtx, 0, [], nodesFull);
};
