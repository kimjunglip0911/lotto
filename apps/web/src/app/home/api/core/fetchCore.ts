/**
 * 홈 화면에서 서버에 데이터를 **조회**하거나 **저장**할 때 쓰는 공통 요청 도구입니다.
 *
 * 하는 일
 * - **조회(`getJsonOrNull`)**: 서버에 한 번 물어보고, 정상 답이 오면 내용을 넘깁니다.
 *   실패·거절·끊김이면 null을 넘기고 끝냅니다(화면이 멈추지 않게 오류를 밖으로 던지지 않음).
 * - **저장(`postOk`)**: 보낼 내용을 서버에 넘기고, 성공했는지(true/false)만 알려 줍니다.
 *   답 내용을 읽을 필요가 없는 저장 버튼용입니다.
 *
 * 무엇이 필요한지
 * - 이미 완성된 서버 주소(`url.ts`의 `homeApiUrl` 등).
 * - 조회 시 취소·“항상 새로 받기” 설정은 필요할 때만 함께 넘깁니다.
 *
 * 역할 나눔
 * - 주소 만들기·캐시 끄기 설정은 `url.ts`.
 * - 저장 경로·보낼 본문 만들기는 `constants/apiPath`, `logic/saveBody`, `api/win/saveWin`.
 *
 * 이 파일을 쓰는 곳
 * - `api/win/winByDraw`, `api/draw/drawNums`, `api/recommend/drawings` (조회)
 * - `api/win/saveWin` (저장)
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

export const postOk = async (url: string, body: unknown): Promise<boolean> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
};
