import { isWinningNumberRow } from '../../logic/numCounts';
import type { WinningNumberRow } from '../../types';
import { fetchAccumulatedApi } from '../fetchCore';

// 선택한 회차의 당첨 번호 한 줄을 불러온다.

export const fetchWinningNumberByDraw = async (drawNo: number): Promise<WinningNumberRow> => {
  const response = await fetchAccumulatedApi(`winning-number?draw_no=${drawNo}`, { cache: 'no-store' });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw new Error(`Failed to fetch selected winning number: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isWinningNumberRow(data)) {
    throw new Error('Selected winning number response is invalid');
  }

  return data;
};
