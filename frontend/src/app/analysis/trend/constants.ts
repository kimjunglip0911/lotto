/** 단일 트렌드 EMA 평활 계수(k) */
export const K_TREND = 0.15;
/** 회차당 트렌드 출현 집계에 쓰는 주번호 개수(보너스 제외) */
export const MAIN_NUMBERS_PER_DRAW = 6;
export const TOTAL_NUMBERS = 45;

/** 최종 조합 화면: 편차 구간 출현확률(%)이 이 값 이하인 번호를 후보에서 제외할 때 사용 */
export const TREND_EXCLUSION_THRESHOLD_PERCENT = 8;

/**
 * 최종 조합 `getTrendExcludedNumbers`: 구간별 당첨 포함 회차가 이 값 이하이면 출현확률과 무관하게 제외 후보.
 * (당첨 포함 회차 ≤ 이 값 → 제외)
 */
export const TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT = 10;

export const CHART_W_PER_NUM = 36;
export const CHART_H = 200;
export const CHART_PADDING_TOP = 16;
export const CHART_PADDING_BOTTOM = 24;
export const CHART_INNER_H = CHART_H - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
