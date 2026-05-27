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
