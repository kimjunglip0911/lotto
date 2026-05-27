/** 응답 본문을 JSON으로 받아 반환한다. 상태 코드 검증만 수행한다. */
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

/** 응답 ok 여부만 확인하고 JSON을 반환한다. 실패 시 null. */
export const fetchJsonOrNull = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T | null> => {
  const response = await fetch(url, init);
  if (!response.ok) return null;
  return (await response.json()) as T;
};
