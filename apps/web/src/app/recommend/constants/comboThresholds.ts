/** 조합 생성 임계값 — band·rank 기준 */

export const TARGET_SET_COUNT = 20;

/** 20세트 전체에서 동일 번호 최대 사용 횟수 */
export const MAX_NUM_USAGE = 3;

/** 자리별 동일 순위 band를 연속 rank 슬롯에 사용하는 횟수(1등×3 → 2등×3 …) */
export const BAND_TIER_REPEATS = 3;

/** 자리별 band 순위 ladder 최대 깊이(1등→2등→… per position) */
export const MAX_BAND_LADDER_DEPTH = 20;

/** 미사용 번호·고저 무시로 채우는 rank 슬롯 시작(19~20) */
export const TAIL_UNUSED_RANK_START = 19;

/** 2단계 폴백 세트 strategy 접두사 */
export const FALLBACK_STRATEGY_PREFIX = 'combo:fallback:';

export const METHOD_JL = 'JL Wheel Method';
