/** home API 베이스 URL과 경로를 조합한다 */

const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const homeApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

export const noStoreInit = { cache: 'no-store' as RequestCache };
