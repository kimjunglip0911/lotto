import type { WinningNumberRow } from '../../types';
import { runStreakApiUrl } from '../core/url';
import { isWinningNumberRow, parseWinningNumberRowResponse } from '../parse/winRow';
import type { RunStreakFetchContext } from '../types/fetchCtx';

const noStore = { cache: 'no-store' as RequestCache };

/** 선택 회차 당첨번호와 직전까지의 당첨 이력을 병렬로 불러온다. */
export const loadDrawWithHistory = async (
  drawNo: number,
  ctx?: RunStreakFetchContext,
): Promise<{ winning: WinningNumberRow; rows: WinningNumberRow[] }> => {
  const init: RequestInit = { ...noStore };
  if (ctx?.signal) init.signal = ctx.signal;
  const base = ctx?.baseUrl;
  const [winRes, rangeRes] = await Promise.all([
    fetch(runStreakApiUrl(`winning-number?draw_no=${drawNo}`, base), init),
    fetch(runStreakApiUrl(`winning-numbers-range?draw_no=${drawNo}`, base), init),
  ]);
  if (!winRes.ok) {
    if (winRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    throw new Error(`Failed to fetch winning number: ${winRes.status}`);
  }
  if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
  const winning: unknown = await winRes.json();
  const range: unknown = await rangeRes.json();
  return {
    winning: parseWinningNumberRowResponse(winning, 'Winning number response is invalid'),
    rows: Array.isArray(range) ? range.filter(isWinningNumberRow) : [],
  };
};
