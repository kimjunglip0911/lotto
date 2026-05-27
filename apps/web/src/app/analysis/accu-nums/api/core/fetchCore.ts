import { accumulatedNumbersApiUrl } from './url';

// 신규 경로 404 시 구 `accumulated-numbers` 경로로 1회 재시도해 구 Uvicorn과 호환.

const ACCU_API_SEG = '/api/analysis/accu-nums/';
const LEGACY_API_SEG = '/api/analysis/accumulated-numbers/';

const legacyAccumUrl = (primaryUrl: string): string | null =>
  primaryUrl.includes(ACCU_API_SEG) ? primaryUrl.replace(ACCU_API_SEG, LEGACY_API_SEG) : null;

/** 구 Uvicorn(예전 경로만 등록) 호환: 신규 URL이 404일 때 한 번만 예전 경로로 재시도 */
export const fetchAccumulatedApi = async (
  pathWithQuery: string,
  init: RequestInit,
  baseUrl?: string,
): Promise<Response> => {
  const primary = accumulatedNumbersApiUrl(pathWithQuery, baseUrl);
  const first = await fetch(primary, init);
  if (first.status !== 404) {
    return first;
  }
  const legacy = legacyAccumUrl(primary);
  if (!legacy || legacy === primary) {
    return first;
  }
  return fetch(legacy, init);
};
