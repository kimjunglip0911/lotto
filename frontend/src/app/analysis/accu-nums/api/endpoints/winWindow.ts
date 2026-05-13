import type { WinningNumberRow } from '../../types';
import { fetchAccumulatedApi } from '../fetchCore';
import { parseWinningNumberRowsResponse } from '../parse';

// 선택 회차 직전까지의 윈도우(예: 104회) 누적용 당첨 행을 불러온다.

export const fetchWinningNumbersWindow = async (
  drawNo: number,
  windowSize: number,
): Promise<WinningNumberRow[]> => {
  const response = await fetchAccumulatedApi(
    `winning-numbers-window?draw_no=${drawNo}&window_size=${windowSize}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers window: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers window response is not an array');
};
