const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** `/api/analysis/run-streak/` 이하 경로·쿼리 */
export const finalPickApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}/api/analysis/run-streak/${pathWithQuery}`;

/** 전체 조회 가능 회차 목록 */
export const drawNumbersApiUrl = (baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}/api/drawings/draw-numbers`;
