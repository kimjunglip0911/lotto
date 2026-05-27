import { fetchJson } from '../core/fetchCore';
import { trendApiUrl } from '../core/url';
import type { TrendFetchContext } from '../types/fetchCtx';

const noStore = { cache: 'no-store' as RequestCache };

/** 검색 가능 회차 번호 목록을 불러온다. */
export const loadDrawNumbers = async (ctx?: TrendFetchContext): Promise<number[]> => {
  const data = await fetchJson<unknown>(trendApiUrl('draw-numbers', ctx?.baseUrl), {
    signal: ctx?.signal,
    ...noStore,
  });
  if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
  return data.filter((item): item is number => typeof item === 'number');
};
