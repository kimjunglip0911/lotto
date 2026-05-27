export const NUMBER_RANGE_MAX = 45;

export const createEmptyCounts = () => Array.from({ length: NUMBER_RANGE_MAX }, () => 0);

/** 누적 분석 고정 윈도: 2년(52회×2) */
export const ACCUMULATED_STRATEGY_WINDOW_DRAWS = 104;
