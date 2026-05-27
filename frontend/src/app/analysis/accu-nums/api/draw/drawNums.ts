import { fetchAccumulatedApi } from '../core/fetchCore';
import { parseNumberArrayResponse } from '../parse/numArr';
import type { AccumulatedNumbersFetchContext } from '../types/fetchCtx';

// 검색 가능 회차 번호 목록을 불러온다.

export const fetchDrawNumbers = async (ctx?: AccumulatedNumbersFetchContext): Promise<number[]> => {
  const signal = ctx?.signal;
  const baseUrl = ctx?.baseUrl;
  const response = await fetchAccumulatedApi('draw-numbers', { signal, cache: 'no-store' }, baseUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch draw numbers: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseNumberArrayResponse(data, 'Draw numbers response is not an array');
};
