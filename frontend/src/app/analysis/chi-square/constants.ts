export const CHI_SQUARE_THRESHOLD = 3.84;
export const TOTAL_NUMBERS = 45;
/** 회차당 집계·기대값에 쓰는 본번호 개수(보너스 제외). E = n × 이 값 / 45. */
export const NUMBERS_PER_DRAW = 6;
/** 카이제곱 페이지「사용 번호」채택 개수(구간 비율 통합 순위). */
export const ADOPTED_USAGE_NUMBER_COUNT = 14;
/** 구간별 채택 점수 분모 `max(이 값, 해당 구간 번호 수)` — 풀 크기 0 방지·정책 하한. */
export const CHI_SQUARE_ADOPTION_BIN_MIN_POOL = 1;
/** 편차(O−E) 구간 워크포워드 집계에 쓰는 최근 회차 수(주 1회 가정 시 약 10년). */
export const CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS = 520;
/** 편차(O−E) 워크포워드·구간 표의 한 칸 폭(1이면 정수 단위 반개구간 `[k,k+1)`). */
export const CHI_SQUARE_DEVIATION_BIN_WIDTH = 1;
/** 편차가 이 값 미만이면 말단 구간으로 묶는다. */
export const CHI_SQUARE_DEVIATION_BIN_RANGE_MIN = -300;
/** 편차가 이 값 이상이면 말단 구간으로 묶는다. 일반 구간은 `[start, start+WIDTH)` 중 `start < 이 값`. */
export const CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE = 300;
export const CHART_HALF_H = 110;
