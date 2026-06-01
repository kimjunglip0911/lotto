import { chiSquareApiUrl } from '@/app/recommend/api/core/url';

/**
 * 추천 화면에서 사용할 당첨 번호 조회 주소를 만들고 서버 호출을 시작한다.
 * - 입력: 서버 주소와 회차 번호를 받는다.
 * - 출력: 서버 응답을 나중에 꺼내 쓸 수 있는 Promise<Response>를 돌려준다.
 * - 역할 분리: 이 파일은 "조회 요청 시작"만 담당하고, 응답 해석·검증은 호출한 쪽 로직에서 처리한다.
 * - 실패 영향: 네트워크 문제나 서버 오류가 나면 reject 또는 오류 응답으로 넘어가며,
 *   화면 쪽 상위 로직에서 예외 처리/대체 흐름을 결정한다.
 */

const buildPath = (route: string, drawNo: number) => `${route}?draw_no=${drawNo}`;
const fetchWinning = (apiUrl: string, route: string, drawNo: number) =>
  fetch(chiSquareApiUrl(buildPath(route, drawNo), apiUrl));

export const fetchWinningOne = async (apiUrl: string, drawNo: number) =>
  fetchWinning(apiUrl, 'winning-number', drawNo);

export const fetchWinningRange = async (apiUrl: string, drawNo: number) =>
  fetchWinning(apiUrl, 'winning-numbers-range', drawNo);
