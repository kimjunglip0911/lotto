const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** GET `/api/analysis/trend/draw-numbers` · `winning-number?draw_no=` · `all-history?draw_no=` */
export const trendApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}/api/analysis/trend/${pathWithQuery}`;
