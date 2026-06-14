/** band 수리·프로필 생성에 쓰는 타입 */

export type ProfileFailureReason =
  | 'rank_unavailable'
  | 'no_band_in_pool'
  | 'constraints_unsat'
  | 'duplicate_only'
  | 'usage_limit'
  | 'ok';

export type ForceBuildOptions = {
  allowBacktrack?: boolean;
  bandTier?: number;
};

export type SetViolation = 'sum_high' | 'sum_low' | 'band' | 'duplicate';

export type ProfileConstraints = {
  minSum: number;
  maxSum: number;
  bandTargets: readonly number[];
  /** 자리별 1등→2등→… band 인덱스. 있으면 해당 rung 중 하나면 band OK */
  bandLadder?: readonly (readonly number[])[];
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
