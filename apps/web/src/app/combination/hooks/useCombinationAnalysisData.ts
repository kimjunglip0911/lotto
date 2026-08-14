import { useEffect, useState } from 'react';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_POSITION_BAND_WINDOW } from '@/lib/statsWindow';
import { loadCombinationHistory } from '../api/loadHistory';
import { buildPositionBandDistribution } from '../logic/buildPositionBandDistribution';
import type { PositionBandDistributionRow } from '../types';

export type UseCombinationAnalysisDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  positionBandRows: PositionBandDistributionRow[];
};

export function useCombinationAnalysisData(): UseCombinationAnalysisDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalDraws, setTotalDraws] = useState(0);
  const [positionBandRows, setPositionBandRows] = useState<PositionBandDistributionRow[]>([]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const allRows = await loadCombinationHistory({ signal: abortController.signal });
        if (!isMounted) return;
        if (allRows.length === 0) {
          setTotalDraws(0);
          setPositionBandRows([]);
          return;
        }
        const windowRows = sliceLatestStatsHistory(allRows, STATS_POSITION_BAND_WINDOW);
        const positionBand = buildPositionBandDistribution(windowRows);
        setTotalDraws(positionBand.totalDraws);
        setPositionBandRows(positionBand.rows);
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error loading combination analysis:', error);
        setLoadError('데이터를 불러오지 못했습니다.');
        setTotalDraws(0);
        setPositionBandRows([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return { isLoading, loadError, totalDraws, positionBandRows };
}
