export const CHI_SQUARE_THRESHOLD = 3.84;
export const TOTAL_NUMBERS = 45;
/** 회차당 집계·기대값에 쓰는 본번호 개수(보너스 제외). E = n × 이 값 / 45. */
export const NUMBERS_PER_DRAW = 6;
/**
 * 워크포워드 조건부 확률 제외: `roundsMatched * 100 <= 이값 * roundsHit`이면 이 값(%) 이하로 보아 제외(초과만 잔여).
 * 부동소수 비교 대신 정수식으로 경계(예: 6.01%급)를 맞춘다.
 */
export const CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR = 6;
/** 겹침 회차(`roundsMatched`)가 이 값 이하면 제외(초과만 잔여). */
export const CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS = 3;
/** 구간별 채택 점수 분모 `max(이 값, 해당 구간 번호 수)` — 풀 크기 0 방지·정책 하한. */
export const CHI_SQUARE_ADOPTION_BIN_MIN_POOL = 1;
/** 편차(O−E) 구간 워크포워드 집계에 쓰는 최근 회차 수(주 1회 가정 시 약 20년, 52×20). */
export const CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS = 1040;
/** 편차(O−E) 워크포워드·구간 표의 한 칸 폭(1이면 정수 단위 반개구간 `[k,k+1)`). */
export const CHI_SQUARE_DEVIATION_BIN_WIDTH = 1;
/** 편차가 이 값 미만이면 말단 구간으로 묶는다. */
export const CHI_SQUARE_DEVIATION_BIN_RANGE_MIN = -300;
/** 편차가 이 값 이상이면 말단 구간으로 묶는다. 일반 구간은 `[start, start+WIDTH)` 중 `start < 이 값`. */
export const CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE = 300;
export const CHART_HALF_H = 110;
