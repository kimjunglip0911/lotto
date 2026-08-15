import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import type { ProfileFailureReason } from '@/app/recommend/logic/repair';

export const FAILURE_REASON_KO: Record<ProfileFailureReason, string> = {
  ok: '',
  rank_unavailable: 'rank 통계 부족',
  no_band_in_pool: '채택 풀에 자리 band 후보가 없고, 합만 맞추는 조합도 없음',
  constraints_unsat: '합·자리대를 동시에 맞출 조합 없음(탐색 한도 내)',
  duplicate_only: '조건은 맞지만 이미 만든 6개 번호 조합과 중복',
  usage_limit: `번호가 30세트 전체에서 ${MAX_NUM_USAGE}회 사용 한도에 도달`,
};
