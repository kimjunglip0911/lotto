'use client';

import { useEffect, useState } from 'react';
import { buildGapRankLookup } from '@/app/recommend/logic/gap/gapRank';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';
import { fetchWinningNumbersRange } from '@/lib/accu-nums/api';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_POSITION_BAND_WINDOW } from '@/lib/statsWindow';

const EMPTY_LOOKUP: GapRankLookup = new Map();

/** 기준 회차 직전 3년 표본으로 번호별 현재·평균 간격 lookup */

export const useGapRankLookup = (
  apiUrl: string,
  drawNo: number | null,
): GapRankLookup => {
  const [lookup, setLookup] = useState<GapRankLookup>(() => new Map());

  useEffect(() => {
    if (!drawNo) return;

    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const rows = await fetchWinningNumbersRange(drawNo, { baseUrl: apiUrl });
        if (!isMounted || abortController.signal.aborted) return;

        const windowRows = sliceLatestStatsHistory(rows, STATS_POSITION_BAND_WINDOW);
        setLookup(buildGapRankLookup(windowRows, drawNo));
      } catch {
        if (isMounted) setLookup(new Map());
      }
    };

    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [apiUrl, drawNo]);

  return drawNo ? lookup : EMPTY_LOOKUP;
};
