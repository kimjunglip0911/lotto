/** 선택 회차의 저장된 당첨번호를 불러온다 */

import { fetchJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';
import type { WinningNumbersByDraw } from '../../types/home';

export const loadWinningByDraw = async (
  drawNo: number,
  signal?: AbortSignal,
): Promise<WinningNumbersByDraw | null> =>
  fetchJsonOrNull<WinningNumbersByDraw>(
    homeApiUrl(`/api/drawings/winning-by-no?draw_no=${drawNo}`),
    { signal, ...noStoreInit },
  );
