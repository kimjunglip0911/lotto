/** 조합 생성 임계값 — band·rank 기준 */

export const TARGET_SET_COUNT = 20;

/** 20세트 전체에서 동일 번호 최대 사용 횟수 */
export const MAX_NUM_USAGE = 3;

/** 모든 rank 슬롯의 band ladder 시작 tier(항상 1등) */
export const BAND_LADDER_START_TIER = 1;

/** 자리별 band 순위 ladder 최대 깊이(1등→2등→… per position, 최대 45) */
export const MAX_BAND_LADDER_DEPTH = 45;

/** 2단계 폴백 세트 strategy 접두사 */
export const FALLBACK_STRATEGY_PREFIX = 'combo:fallback:';

export const METHOD_JL = 'JL Wheel Method';
