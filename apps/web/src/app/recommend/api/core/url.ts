/** 추천 API 베이스 URL과 경로를 조합한다 */

export const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const recommendApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

export const chiSquareApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  recommendApiUrl(`/api/analysis/chi-square/${pathWithQuery}`, baseUrl);

export const accuNumsApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  recommendApiUrl(`/api/analysis/accu-nums/${pathWithQuery}`, baseUrl);
