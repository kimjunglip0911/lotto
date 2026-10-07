import { useEffect, useState } from 'react';
import { loadStoredCombo } from '../api/loadStored';
import type { ComboWinView } from '../types/window';
import type { UseCombinationAnalysisDataResult } from './comboDataTypes';

export type { UseCombinationAnalysisDataResult } from './comboDataTypes';

/** 마운트 시 조합 분석 저장본과 기간별 집계를 불러온다. */
export function useCombinationAnalysisData(): UseCombinationAnalysisDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [windows, setWindows] = useState<ComboWinView[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    let live = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await loadStoredCombo({ signal: ac.signal });
        if (!live) return;
        setWindows(data.windows);
      } catch (err) {
        if (ac.signal.aborted || !live) return;
        console.error('Error loading combination analysis:', err);
        setLoadError('데이터를 불러오지 못했습니다.');
        setWindows([]);
      } finally {
        if (live) setIsLoading(false);
      }
    };
    void load();
    return () => {
      live = false;
      ac.abort();
    };
  }, []);

  return { isLoading, loadError, windows };
}
