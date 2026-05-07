import { useEffect, useState } from 'react';
import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards';
import { buildOddEvenDistribution } from '../logic/buildOddEvenDistribution';
import type { OddEvenDistributionRow } from '../types';

const EMPTY_ROWS = buildOddEvenDistribution([]).rows;

type UseOddEvenProbabilityDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  distributionRows: OddEvenDistributionRow[];
};

export function useOddEvenProbabilityData(): UseOddEvenProbabilityDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalDraws, setTotalDraws] = useState(0);
  const [distributionRows, setDistributionRows] = useState<OddEvenDistributionRow[]>(EMPTY_ROWS);

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
          setDistributionRows(EMPTY_ROWS);
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
        const { totalDraws: nextTotal, rows } = buildOddEvenDistribution(validRows);
        if (!isMounted) return;
        setTotalDraws(nextTotal);
        setDistributionRows(rows);
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error loading odd/even distribution:', error);
        setLoadError('데이터를 불러오지 못했습니다.');
        setTotalDraws(0);
        setDistributionRows(EMPTY_ROWS);
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

  return { isLoading, loadError, totalDraws, distributionRows };
}
