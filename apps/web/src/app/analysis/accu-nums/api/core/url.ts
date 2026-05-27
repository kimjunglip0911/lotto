// 누적번호 분석 API 절대 URL 생성. baseUrl 우선, 없으면 NEXT_PUBLIC_API_URL.

const resolveApiBaseUrl = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** `/api/analysis/accu-nums/` 이하 경로·쿼리(예: `draw-numbers`, `winning-number?draw_no=1`) */
export const accumulatedNumbersApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}/api/analysis/accu-nums/${pathWithQuery}`;
