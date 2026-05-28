/** 검색 가능 회차 번호 목록을 불러온다 */

import { getJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';

export const loadDrawNumbers = async (signal?: AbortSignal): Promise<unknown> =>
  getJsonOrNull(homeApiUrl('/api/analysis/accu-nums/draw-numbers'), {
    signal,
    ...noStoreInit,
  });
