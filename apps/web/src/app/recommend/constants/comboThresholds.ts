/** 조합 생성 임계값 — band·rank 기준 */

export const TARGET_SET_COUNT = 20;

/** 20세트 전체에서 동일 번호 최대 사용 횟수 */
export const MAX_NUM_USAGE = 3;

/** 고저 미적용 시 허용 합산 하한·상한 (1+2+3+4+5+6 ~ 40+41+42+43+44+45) */
export const LOTTO_SUM_MIN = 21;
export const LOTTO_SUM_MAX = 255;

/** rank 1의 band ladder 시작 tier(1등). rank N은 tier N 사용 */
export const BAND_LADDER_START_TIER = 1;

/** 자리별 band 순위 ladder 최대 깊이(1등→2등→… per position, 최대 45) */
export const MAX_BAND_LADDER_DEPTH = 45;

/** 2단계 폴백 세트 strategy 접두사 */
export const FALLBACK_STRATEGY_PREFIX = 'combo:fallback:';

export const METHOD_JL = 'JL Wheel Method';
