/** band 수리·프로필 생성에 쓰는 타입 */

import type {
  PositionDrawCountLookup,
  PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

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
  /** 번호 1~45당 당첨 이력 출현 횟수(인덱스 0 = 번호 1) */
  histCounts?: readonly number[];
  /** UI 구간별 번호 순위 lookup(조합 분석과 동일) */
  positionRankLookup?: PositionRankLookup;
  /** 구간별 조합분석 총 회차(drawCount) lookup */
  positionDrawCountLookup?: PositionDrawCountLookup;
  /** 번호별 현재 간격과 평균 간격의 근접 순위 */
  gapRankLookup?: GapRankLookup;
};

export type RepairStepOptions = {
  ignoreSum?: boolean;
};
