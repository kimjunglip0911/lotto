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

export const STATS_WINDOW_FOUR_YEAR = 208;

export const STATS_WINDOW_FOUR_YEAR_LABEL = '4년';

export const STATS_WINDOW_FIVE_YEAR = 260;

export const STATS_WINDOW_FIVE_YEAR_LABEL = '5년';

export const STATS_WINDOW_TEN_YEAR = 520;

export const STATS_WINDOW_TEN_YEAR_LABEL = '10년';

/** DB 전체 이력(회차 수 상한 없음) */
export const STATS_WINDOW_ALL = Number.POSITIVE_INFINITY;

export const STATS_WINDOW_ALL_LABEL = '전체';

/** 고정 N회가 아닌 전체 표본인지 */
export const isStatsWindowAll = (windowSize: number): boolean =>
  !Number.isFinite(windowSize);

/** UI 표본 설명(집계 회차 totalDraws는 전체일 때 실제 건수) */
export const formatStatsSampleDesc = (
  label: string,
  windowSize: number,
  totalDraws?: number,
): string => {
  if (isStatsWindowAll(windowSize)) {
    const n = totalDraws ?? 0;
    return n > 0
      ? `DB에 저장된 전체 ${n.toLocaleString()}회(${label})`
      : `DB에 저장된 전체(${label})`;
  }
  return `DB에 저장된 최근 ${windowSize}회(${label})`;
};

/** 생성 요약 등 짧은 표본 표기 */
export const formatStatsBandSummary = (
  label: string,
  windowSize: number,
  actualDraws?: number,
): string => {
  if (isStatsWindowAll(windowSize)) {
    const n = actualDraws ?? 0;
    return n > 0 ? `${label}(${n}회)` : label;
  }
  return `${label}(${windowSize}회)`;
};

/** 조합 분석 구간별 번호 확률·고저 합산 표본 */
export const STATS_POSITION_BAND_WINDOW = STATS_WINDOW_THREE_YEAR;

export const STATS_POSITION_BAND_LABEL = STATS_WINDOW_THREE_YEAR_LABEL;

/** 추천 band 순위 표본(3년 단일 윈도우) */
export const STATS_BAND_CASCADE_WINDOWS = [STATS_WINDOW_THREE_YEAR] as const;

export const STATS_BAND_CASCADE_LABEL = STATS_WINDOW_THREE_YEAR_LABEL;
