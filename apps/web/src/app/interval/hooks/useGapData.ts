import { useEffect, useState } from 'react';
import { loadGapHistory } from '../api/loadHistory';
import { buildGapRows, gapDrawCount } from '../logic/buildGapRows';
import type { GapRow } from '../types/interval';

export type UseGapDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  rows: GapRow[];
};

const EMPTY: UseGapDataResult = {
  isLoading: true,
  loadError: null,
  totalDraws: 0,
  rows: [],
};

export const useGapData = (): UseGapDataResult => {
  const [data, setData] = useState<UseGapDataResult>(EMPTY);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();
    const load = async () => {
      try {
        const history = await loadGapHistory({ signal: ac.signal });
        if (!alive) return;
        setData({
          isLoading: false,
          loadError: null,
          totalDraws: gapDrawCount(history),
          rows: buildGapRows(history),
        });
      } catch (error) {
        if (ac.signal.aborted || !alive) return;
        console.error('Error loading interval data:', error);
        setData({ isLoading: false, loadError: '데이터를 불러오지 못했습니다.', totalDraws: 0, rows: [] });
      }
    };
    void load();
    return () => {
      alive = false;
      ac.abort();
    };
  }, []);

  return data;
};
