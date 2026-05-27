const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** `/api/analysis/chi-square/` 이하 경로·쿼리 */
export const chiSquareApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}/api/analysis/chi-square/${pathWithQuery}`;
