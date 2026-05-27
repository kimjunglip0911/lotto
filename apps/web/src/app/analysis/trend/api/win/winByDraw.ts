import { isWinningNumberRow } from '../../logic/guards';
import type { WinningNumberRow } from '../../types';
import { fetchJson } from '../core/fetchCore';
import { trendApiUrl } from '../core/url';
import type { TrendFetchContext } from '../types/fetchCtx';

const noStore = { cache: 'no-store' as RequestCache };

/** 선택 회차 당첨번호 한 줄을 불러온다. */
export const loadWinningByDraw = async (
  drawNo: number,
  ctx?: TrendFetchContext,
): Promise<WinningNumberRow> => {
  const data = await fetchJson<unknown>(
    trendApiUrl(`winning-number?draw_no=${drawNo}`, ctx?.baseUrl),
    { signal: ctx?.signal, ...noStore },
  );
  if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
  return data;
};
