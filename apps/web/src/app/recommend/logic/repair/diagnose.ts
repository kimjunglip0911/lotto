import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type {
  ForceBuildOptions,
  ProfileConstraints,
  ProfileFailureReason,
  RepairPickCtx,
} from '@/app/recommend/logic/repair/types';
import { canPickBandSkeleton } from '@/app/recommend/logic/repair/backtrack';
import { buildMetricsOnlyFromPool } from '@/app/recommend/logic/repair/metricsOnly';
import { forceBuildOneSet } from '@/app/recommend/logic/repair/forceBuild';

const setKeyFromSorted = (sorted: readonly number[]): string => [...sorted].join(',');

/** 프로필 미생성 원인 진단 */

export const diagnoseProfileBuild = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  usedKeys: ReadonlySet<string>,
  pickCtx: RepairPickCtx = {},
  options?: ForceBuildOptions,
): ProfileFailureReason => {
  if (!canPickBandSkeleton(poolByBand, constraints.bandTargets, pickCtx)) {
    const metrics = buildMetricsOnlyFromPool(
      poolByBand,
      constraints,
      pickCtx,
      PROFILE_BUILD_ATTEMPTS,
    );
    if (!metrics) return 'no_band_in_pool';
    if (usedKeys.has(setKeyFromSorted(metrics))) return 'duplicate_only';
    return 'ok';
  }
  const built = forceBuildOneSet(poolByBand, constraints, pickCtx, options);
  if (!built) return 'constraints_unsat';
  if (usedKeys.has(setKeyFromSorted(built))) return 'duplicate_only';
  return 'ok';
};
