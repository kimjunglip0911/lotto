/**
 * 홈 화면에서 서버에 번호·당첨·추천 데이터를 물어볼 때 쓰는 공통 조회 도구입니다.
 *
 * 하는 일
 * - 서버 주소로 한 번 요청을 보내고, 정상적으로 답이 오면 받은 내용을 그대로 넘깁니다.
 * - 주소가 잘못되었거나, 서버가 거절·오류를 알려 주거나, 네트워크가 끊기면
 *   화면이 멈추지 않도록 빈 값(null)을 넘기고 끝냅니다(밖으로 오류를 던지지 않음).
 *
 * 무엇이 필요한지
 * - 이미 완성된 서버 주소(같은 폴더 `url.ts`의 `homeApiUrl` 등으로 미리 만든 주소).
 * - 요청을 중간에 취소하거나, 예전에 받아 둔 내용을 쓰지 않게 하는 설정은
 *   필요할 때만 함께 넘깁니다.
 *
 * 역할 나눔
 * - 주소를 만드는 일·“항상 새로 받기” 같은 설정은 `url.ts`가 담당합니다.
 *
 * 이 파일을 쓰는 곳
 * - `api/win/winByDraw` (회차별 당첨)
 * - `api/draw/drawNums` (추첨 번호)
 * - `api/recommend/drawings` (추천 조합)
 */

const parseJsonBody = async <T>(response: Response): Promise<T> =>
  (await response.json()) as T;

export const getJsonOrNull = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T | null> => {
  const response = await fetch(url, init);
  if (!response.ok) return null;
  return parseJsonBody<T>(response);
};
