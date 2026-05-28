/** 선택 회차의 추천 분석 세트 목록을 불러온다 */

import { getJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';

export const loadDrawings = async (drawNo: number, signal?: AbortSignal): Promise<unknown> =>
  getJsonOrNull(homeApiUrl(`/api/recommend/drawings?draw_no=${drawNo}`), {
    signal,
    ...noStoreInit,
  });
