/** Nest API 베이스(서버 전용). 미설정 시 로컬 8010 */
export const getApiOrigin = (): string =>
  (process.env.API_PROXY_ORIGIN ?? 'http://localhost:8010').replace(
    /\/$/,
    '',
  );
