'use client';

import { useEffect, useState } from 'react';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import {
  buildPositionRankLookup,
  type PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import { fetchWinningNumbersRange } from '@/lib/accu-nums/api';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_POSITION_BAND_WINDOW } from '@/lib/statsWindow';

/** 기준 회차 직전 1년 표본으로 자리별 번호 순위 lookup */

export const usePositionRankLookup = (
  apiUrl: string,
  drawNo: number | null,
): PositionRankLookup => {
  const [lookup, setLookup] = useState<PositionRankLookup>(new Map());

  useEffect(() => {
    if (!drawNo) {
      setLookup(new Map());
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const rows = await fetchWinningNumbersRange(drawNo, { baseUrl: apiUrl });
        if (!isMounted || abortController.signal.aborted) return;

        const windowRows = sliceLatestStatsHistory(rows, STATS_POSITION_BAND_WINDOW);
        const sorted = windowRows.sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains);
        const { rows: flat } = buildPositionBandDistribution(sorted);
        setLookup(buildPositionRankLookup(rankPositionBandRows(flat)));
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

  return lookup;
};
