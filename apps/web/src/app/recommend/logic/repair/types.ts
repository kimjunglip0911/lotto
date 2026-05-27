/** band 수리·프로필 생성에 쓰는 타입 */

export type ProfileFailureReason =
  | 'rank_unavailable'
  | 'no_band_in_pool'
  | 'constraints_unsat'
  | 'duplicate_only'
  | 'ok';

export type ForceBuildOptions = {
  allowBacktrack?: boolean;
  bandTier?: number;
  lightOe?: boolean;
};

export type SetViolation = 'sum_high' | 'sum_low' | 'even' | 'run' | 'band' | 'duplicate';

export type ProfileConstraints = {
  minSum: number;
  maxSum: number;
  evenT: number;
  runT: number;
  bandTargets: readonly number[];
};

export type ValidateResult = {
  ok: boolean;
  violations: SetViolation[];
};

export type RepairPickCtx = {
  usage?: ReadonlyMap<number, number>;
  innerSlotUsage?: ReadonlyMap<string, number>;
};

export type RepairStepOptions = {
  ignoreSum?: boolean;
};
