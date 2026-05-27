import { isWinningNumberRow } from '../../logic/guards';
import type { WinningNumberRow } from '../../types';
import { fetchJson } from '../core/fetchCore';
import { trendApiUrl } from '../core/url';
import type { TrendFetchContext } from '../types/fetchCtx';

const noStore = { cache: 'no-store' as RequestCache };

/** 기준 회차 미만 전체 당첨 이력을 불러온다. */
export const loadAllHistory = async (
  drawNo: number,
  ctx?: TrendFetchContext,
): Promise<WinningNumberRow[]> => {
  const data = await fetchJson<unknown>(
    trendApiUrl(`all-history?draw_no=${drawNo}`, ctx?.baseUrl),
    { signal: ctx?.signal, ...noStore },
  );
  if (!Array.isArray(data)) throw new Error('All history response is not an array');
  return data.filter(isWinningNumberRow);
};
