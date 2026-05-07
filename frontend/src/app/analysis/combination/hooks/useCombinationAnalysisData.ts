import { useEffect, useState } from 'react';
import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards';
import { buildConsecutiveRunDistribution } from '../logic/buildConsecutiveRunDistribution';
import { buildOddEvenDistribution } from '../logic/buildOddEvenDistribution';
import { buildPositionBandDistribution } from '../logic/buildPositionBandDistribution';
import type {
  ConsecutiveRunDistributionRow,
  OddEvenDistributionRow,
  PositionBandDistributionRow,
} from '../types';

const EMPTY_ODD_EVEN = buildOddEvenDistribution([]).rows;
const EMPTY_CONSECUTIVE = buildConsecutiveRunDistribution([]).rows;

type UseCombinationAnalysisDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  oddEvenRows: OddEvenDistributionRow[];
  consecutiveRows: ConsecutiveRunDistributionRow[];
  positionBandRows: PositionBandDistributionRow[];
};

export function useCombinationAnalysisData(): UseCombinationAnalysisDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalDraws, setTotalDraws] = useState(0);
  const [oddEvenRows, setOddEvenRows] = useState<OddEvenDistributionRow[]>(EMPTY_ODD_EVEN);
  const [consecutiveRows, setConsecutiveRows] =
    useState<ConsecutiveRunDistributionRow[]>(EMPTY_CONSECUTIVE);
  const [positionBandRows, setPositionBandRows] = useState<PositionBandDistributionRow[]>([]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const drawsResponse = await fetch(`${apiUrl}/api/analysis/chi-square/draw-numbers`, {
          signal: abortController.signal,
        });
        if (!drawsResponse.ok) {
          throw new Error(`Failed to fetch draw numbers: ${drawsResponse.status}`);
        }
        const drawsPayload: unknown = await drawsResponse.json();
        if (!Array.isArray(drawsPayload)) {
          throw new Error('Draw numbers response is not an array');
        }
        const draws = drawsPayload.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;

        if (draws.length === 0) {
          setTotalDraws(0);
          setOddEvenRows(EMPTY_ODD_EVEN);
          setConsecutiveRows(EMPTY_CONSECUTIVE);
          setPositionBandRows([]);
          return;
        }

        const maxDraw = Math.max(...draws);
        const rangeResponse = await fetch(
          `${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${maxDraw + 1}`,
          { signal: abortController.signal },
        );
        if (!rangeResponse.ok) {
          throw new Error(`Failed to fetch winning numbers range: ${rangeResponse.status}`);
        }
        const rangePayload: unknown = await rangeResponse.json();
        if (!Array.isArray(rangePayload)) {
          throw new Error('Winning numbers range response is not an array');
        }
        const validRows = rangePayload.filter(isWinningNumberRow);
        const oddEven = buildOddEvenDistribution(validRows);
        const consecutive = buildConsecutiveRunDistribution(validRows);
        const positionBand = buildPositionBandDistribution(validRows);
        if (!isMounted) return;
        setTotalDraws(oddEven.totalDraws);
        setOddEvenRows(oddEven.rows);
        setConsecutiveRows(consecutive.rows);
        setPositionBandRows(positionBand.rows);
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error loading combination analysis:', error);
        setLoadError('데이터를 불러오지 못했습니다.');
        setTotalDraws(0);
        setOddEvenRows(EMPTY_ODD_EVEN);
        setConsecutiveRows(EMPTY_CONSECUTIVE);
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

  return { isLoading, loadError, totalDraws, oddEvenRows, consecutiveRows, positionBandRows };
}
