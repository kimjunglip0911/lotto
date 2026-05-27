import type { WinningNumberRow } from '../../types';
import { fetchChiSquareApi } from '../core/fetchCore';
import { parseWinningNumberRowResponse } from '../parse/winRow';

export const fetchWinningNumberByDraw = async (drawNo: number): Promise<WinningNumberRow> => {
  const response = await fetchChiSquareApi(`winning-number?draw_no=${drawNo}`, { cache: 'no-store' });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw new Error(`Failed to fetch winning number: ${response.status}`);
  }
  const data: unknown = await response.json();
  return parseWinningNumberRowResponse(data, 'Winning number response is invalid');
};
