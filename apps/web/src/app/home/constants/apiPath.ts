/**
 * 홈 화면에서 서버에 요청할 때 쓰는 **경로 문자열**만 모아 둔 곳입니다.
 *
 * 하는 일
 * - 회차 목록·당첨·추천 세트 등 API 주소의 뒷부분(`/api/...`)을 한곳에서 관리합니다.
 *
 * 주의·화면에 미치는 영향
 * - 여기 적힌 문자열이 바뀌면 실제 서버 주소와 맞지 않아 홈 회차 선택·세트 표시가 비거나 갱신되지 않을 수 있습니다.
 */

/** 누적 분석에서 검색 가능한 회차 번호 목록을 받는 경로 */
export const HOME_DRAW_NUMBERS_PATH =
  '/api/analysis/accu-nums/draw-numbers' as const;

/** 선택 회차의 추천 분석 세트 목록을 받는 경로(회차 번호는 조회 시 붙임) */
export const HOME_RECOMMEND_DRAWINGS_PATH =
  '/api/recommend/drawings' as const;
