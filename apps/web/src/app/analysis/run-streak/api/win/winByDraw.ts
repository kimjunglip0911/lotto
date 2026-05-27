import type { WinningNumberRow } from '../../types';
import { fetchJson } from '../core/fetchCore';
import { runStreakApiUrl } from '../core/url';
import { parseWinningNumberRowResponse } from '../parse/winRow';
import type { RunStreakFetchContext } from '../types/fetchCtx';

const noStore = { cache: 'no-store' as RequestCache };

/** 선택 회차 당첨번호 한 줄을 불러온다. */
export const loadFirstDrawWinning = async (
  drawNo: number,
  ctx?: RunStreakFetchContext,
): Promise<WinningNumberRow> => {
  const data = await fetchJson<unknown>(
    runStreakApiUrl(`winning-number?draw_no=${drawNo}`, ctx?.baseUrl),
    { signal: ctx?.signal, ...noStore },
  );
  return parseWinningNumberRowResponse(data, 'Winning number response is invalid');
};
