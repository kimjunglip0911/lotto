import { fetchChiSquareApi } from '../core/fetchCore';
import { parseNumberArrayResponse } from '../parse/numArr';
import type { ChiSquareFetchContext } from '../types/fetchCtx';

export const fetchDrawNumbers = async (ctx?: ChiSquareFetchContext): Promise<number[]> => {
  const response = await fetchChiSquareApi('draw-numbers', { signal: ctx?.signal, cache: 'no-store' }, ctx?.baseUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch draw numbers: ${response.status}`);
  }
  const data: unknown = await response.json();
  return parseNumberArrayResponse(data, 'Draw numbers response is not an array');
};
