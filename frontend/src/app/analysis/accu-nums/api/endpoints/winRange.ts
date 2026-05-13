import type { WinningNumberRow } from '../../types';
import { fetchAccumulatedApi } from '../fetchCore';
import { parseWinningNumberRowsResponse } from '../parse';
import type { AccumulatedNumbersFetchContext } from '../types';

// 선택 회차 직전까지의 전체 당첨 행 목록을 불러온다.

export const fetchWinningNumbersRange = async (
  drawNo: number,
  ctx?: Pick<AccumulatedNumbersFetchContext, 'baseUrl'>,
): Promise<WinningNumberRow[]> => {
  const response = await fetchAccumulatedApi(
    `winning-numbers-range?draw_no=${drawNo}`,
    { cache: 'no-store' },
    ctx?.baseUrl,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers range: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers range response is not an array');
};
