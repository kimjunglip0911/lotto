// 이 파일은 회차/당첨번호 데이터를 서버에서 받아오는 입구입니다.
// 화면 코드 곳곳에서 직접 fetch 하지 않도록 URL 만들기와 응답 받기를 한곳에 모아 둡니다.

const API_BASE = '/api/analysis/run-streak/';

/** `/api/analysis/run-streak/` 이하 경로·쿼리(예: `draw-numbers`, `winning-number?draw_no=1`) */
export const runStreakUrl = (pathWithQuery: string): string => {
  const root = process.env.NEXT_PUBLIC_API_URL || '';
  return `${root}${API_BASE}${pathWithQuery}`;
};

/** 응답 본문을 JSON으로 받아 반환한다. 상태 코드 검증만 수행하며, 형식 검증은 호출부 책임. */
export const fetchJson = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed: ${response.status}`);
  }
  return (await response.json()) as T;
};
