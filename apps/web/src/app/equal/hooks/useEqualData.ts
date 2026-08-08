import { useEffect, useState } from 'react';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { loadEqualHistory } from '../api/loadHistory';
import { EMPTY_BUCKETS, EMPTY_EQUAL_DATA } from '../constants/empty';
import { EQUAL_WINDOW } from '../constants/window';
import { buildEqualBuckets } from '../logic/buildBuckets';
import type { EqualDataState } from '../types/equal';

/** 최근 6회차(보너스 포함) 균등 버킷을 로드한다. */
export function useEqualData(): EqualDataState {
  const [data, setData] = useState<EqualDataState>(EMPTY_EQUAL_DATA);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const history = await loadEqualHistory({ signal: abortController.signal });
        if (!isMounted) return;
        const windowRows = sliceLatestStatsHistory(history, EQUAL_WINDOW);
        setData({
          isLoading: false,
          loadError: null,
          analyzedDraws: windowRows.length,
          buckets: buildEqualBuckets(windowRows),
        });
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error loading equal analysis:', error);
        setData({
          isLoading: false,
          loadError: '데이터를 불러오지 못했습니다.',
          analyzedDraws: 0,
          buckets: EMPTY_BUCKETS,
        });
      }
    };

    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return data;
}
