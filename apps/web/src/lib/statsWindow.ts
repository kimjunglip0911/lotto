/** 조합·추천 통계에 쓰는 당첨 이력 윈도우(주 1회 기준) */

export const STATS_WINDOW_DRAWS = 13;

export const STATS_WINDOW_LABEL = '3개월';

export const STATS_WINDOW_SIX_MONTH = 26;

export const STATS_WINDOW_SIX_MONTH_LABEL = '6개월';

export const STATS_WINDOW_ONE_YEAR = 52;

export const STATS_WINDOW_ONE_YEAR_LABEL = '1년';

/** 추천 cascade band 순위 윈도우 [3개월, 6개월, 1년] */
export const STATS_BAND_CASCADE_WINDOWS = [
  STATS_WINDOW_DRAWS,
  STATS_WINDOW_SIX_MONTH,
  STATS_WINDOW_ONE_YEAR,
] as const;

export const STATS_BAND_CASCADE_LABEL = '3개월→6개월→1년';
