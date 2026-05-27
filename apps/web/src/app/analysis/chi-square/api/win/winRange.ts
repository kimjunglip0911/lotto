import type { WinningNumberRow } from '../../types';
import { fetchChiSquareApi } from '../core/fetchCore';
import { parseWinningNumberRowsResponse } from '../parse/winRows';
import type { ChiSquareFetchContext } from '../types/fetchCtx';

export const fetchWinningNumbersRange = async (
  drawNo: number,
  ctx?: ChiSquareFetchContext,
): Promise<WinningNumberRow[]> => {
  const response = await fetchChiSquareApi(
    `winning-numbers-range?draw_no=${drawNo}`,
    { signal: ctx?.signal, cache: 'no-store' },
    ctx?.baseUrl,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers range: ${response.status}`);
  }
  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers range response is not an array');
};
