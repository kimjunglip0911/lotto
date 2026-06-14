/** 조합·추천 통계에 쓰는 당첨 이력 윈도우(주 1회 기준) */

export const STATS_WINDOW_DRAWS = 13;

export const STATS_WINDOW_LABEL = '3개월';

export const STATS_WINDOW_SIX_MONTH = 26;

export const STATS_WINDOW_SIX_MONTH_LABEL = '6개월';

export const STATS_WINDOW_ONE_YEAR = 52;

export const STATS_WINDOW_ONE_YEAR_LABEL = '1년';

export const STATS_WINDOW_TWO_YEAR = 104;

export const STATS_WINDOW_TWO_YEAR_LABEL = '2년';

export const STATS_WINDOW_THREE_YEAR = 156;

export const STATS_WINDOW_THREE_YEAR_LABEL = '3년';

export const STATS_WINDOW_FIVE_YEAR = 260;

export const STATS_WINDOW_FIVE_YEAR_LABEL = '5년';

export const STATS_WINDOW_TEN_YEAR = 520;

export const STATS_WINDOW_TEN_YEAR_LABEL = '10년';

/** 조합 분석 구간별 번호 확률 표본 */
export const STATS_POSITION_BAND_WINDOW = STATS_WINDOW_TEN_YEAR;

export const STATS_POSITION_BAND_LABEL = STATS_WINDOW_TEN_YEAR_LABEL;

/** 추천 cascade band 순위 윈도우 [3개월, 6개월, 1년] */
export const STATS_BAND_CASCADE_WINDOWS = [
  STATS_WINDOW_DRAWS,
  STATS_WINDOW_SIX_MONTH,
  STATS_WINDOW_ONE_YEAR,
] as const;

export const STATS_BAND_CASCADE_LABEL = '3개월→6개월→1년';
