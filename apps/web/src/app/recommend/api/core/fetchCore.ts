/** HTTP 응답을 JSON으로 받고 상태 코드를 검증한다 */

export const fetchJson = async <T = unknown>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed request: ${response.status} ${url}`);
  }
  return (await response.json()) as T;
};

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
