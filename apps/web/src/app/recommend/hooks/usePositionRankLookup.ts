'use client';

import { useEffect, useState } from 'react';
import type { PositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import { lookupsFromHist, type WinLookups } from '@/app/recommend/logic/combo/winLookup';
import { fetchWinningNumbersRange } from '@/lib/accu-nums/api';

const EMPTY: PositionRankLookup = new Map();

export const EMPTY_LOOKUPS: WinLookups = { '1y': EMPTY, '3y': EMPTY, all: EMPTY };

/** 기준 회차 직전 1년·3년·전체 자리 순위 */

export const usePositionRankLookup = (apiUrl: string, drawNo: number | null): WinLookups => {
  const [lookups, setLookups] = useState<WinLookups>(EMPTY_LOOKUPS);

  useEffect(() => {
    if (!drawNo) return;
    let isMounted = true;
    const abortController = new AbortController();
    const load = async () => {
      try {
        const rows = await fetchWinningNumbersRange(drawNo, { baseUrl: apiUrl });
        if (!isMounted || abortController.signal.aborted) return;
        setLookups(lookupsFromHist(rows));
      } catch {
        if (isMounted) setLookups(EMPTY_LOOKUPS);
      }
    };
    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [apiUrl, drawNo]);

  return drawNo ? lookups : EMPTY_LOOKUPS;
};
