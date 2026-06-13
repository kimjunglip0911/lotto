/** band 수리·세트 생성 — 하위 모듈 re-export */

export {
  MAX_REPAIR_STEPS,
  MAX_SEED_ATTEMPTS,
  PROFILE_BUILD_ATTEMPTS,
  MAX_BACKTRACK_NODES,
  MAX_FORCE_REPAIR_STEPS,
  MAX_STOCHASTIC_REPAIR_STEPS,
  MAX_BFS_REPAIR_VISITS,
  HEAVY_SEARCH_MAX_POOL,
} from '@/app/recommend/constants/repairLimits';

export type {
  ProfileFailureReason,
  ForceBuildOptions,
  SetViolation,
  ProfileConstraints,
  ValidateResult,
  RepairPickCtx,
  RepairStepOptions,
} from '@/app/recommend/logic/repair/types';

export { buildHistCounts, adoptedPoolSize, buildPoolByBand, flatAdoptedPool } from '@/app/recommend/logic/repair/pool';
export { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
export {
  validatePickedSet,
  validateSet,
  validateMetricsOnly,
  validatePickedNoSum,
  hasFallbackBothMetricsOk,
  hasFallbackMetricOk,
} from '@/app/recommend/logic/repair/validate';
export { buildMetricsOnlyFromPool } from '@/app/recommend/logic/repair/metricsOnly';
export { randomPerPositionPick, randomBandSeed } from '@/app/recommend/logic/repair/pick';
export { repairOneStep } from '@/app/recommend/logic/repair/repairStep';
export { tryBuildOneSet } from '@/app/recommend/logic/repair/tryBuild';
export { buildOneSetWithFallback } from '@/app/recommend/logic/repair/buildOneSet';
export { forceBuildOneSet } from '@/app/recommend/logic/repair/forceBuild';
export { diagnoseProfileBuild } from '@/app/recommend/logic/repair/diagnose';
export { canPickBandSkeleton } from '@/app/recommend/logic/repair/backtrack';
export {
  canUseNum,
  filterUsageAvail,
  isSetWithinUsageLimit,
} from '@/app/recommend/logic/repair/usageLimit';
export {
  collectBandCands,
  isBandFallbackOk,
  matchesBandTarget,
} from '@/app/recommend/logic/repair/bandFallback';
