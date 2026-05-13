import { useEffect, useMemo, useState } from 'react';
import { isWinningNumberRow, type WinningNumberRow } from '../types';
import {
  getAccumulatedExclusionNumbers,
  type AccumulatedExclusionResult,
} from '../logic/accumulatedAdoption';
import { getChiSquareFinalPickSlice } from '../logic/chiSquareAdoption';
import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/run-streak/logic/streak/consec';
import { buildNumberCounts } from '@/app/analysis/accu-nums/logic/numberCounts';

const normalizeDrawNumbers = (payload: unknown): number[] => {
  if (!Array.isArray(payload)) return [];

  const normalized = payload
    .map((item) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string') {
        const parsed = Number(item.trim());
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    })
    .filter((item): item is number => item !== null && Number.isInteger(item) && item > 0);

  return [...new Set(normalized)].sort((a, b) => b - a);
};

/**
 * 통합 분석 페이지의 회차 목록·당첨번호 조회 훅.
 *
 * - 통합 분석 전용 백엔드 라우터는 후속 작업에서 도입하며,
 *   현재는 가장 가벼운 `run-streak` 라우터를 재사용한다.
 * - URL 호출은 본 훅 내부에서만 수행하므로 후속 교체 시 한 곳만 바꾸면 된다.
 */
const finalPickApiUrl = (pathWithQuery: string): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/api/analysis/run-streak/${pathWithQuery}`;
};

const drawNumbersApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/api/drawings/draw-numbers`;
};

type UseFinalPickDataResult = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  /** 선택 회차 미만 전체 당첨 행 — 연속 출현 제외 등에서 재사용한다. */
  previousDrawRows: WinningNumberRow[];
  excludedByStreakNumbers: number[];
  /** 누적 출현 극값 제외(2년·전체 슬롯 + 고유 목록). */
  accumulatedExclusion: AccumulatedExclusionResult;
  adoptedByChiSquareNumbers: number[];
  /** 워크포워드 — 조건부 확률(%) 이하로 제외되는 번호(통합 페이지 카드) */
  excludedByChiSquareWalkForwardConditionalPct: number[];
  /** 워크포워드 — 겹침 회차 이하로 제외되는 번호(통합 페이지 카드) */
  excludedByChiSquareWalkForwardOverlapRounds: number[];
  /** 이전 회차까지 본번호 누적 출현 횟수(인덱스 0 = 1번) — 종합 차트용 */
  comprehensiveChartCounts: number[];
  /** `comprehensiveChartCounts` 집계에 포함된 회차 수 */
  comprehensiveChartAnalyzedDrawCount: number;
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  handleSearch: () => Promise<void>;
};

export const useFinalPickData = (): UseFinalPickDataResult => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);

  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [previousDrawRows, setPreviousDrawRows] = useState<WinningNumberRow[]>([]);
  const excludedByStreakNumbers = useMemo(() => {
    if (previousDrawRows.length === 0) return [];
    const drawNo = Number(searchedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 2) return [];
    return getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo);
  }, [previousDrawRows, searchedDraw]);

  const accumulatedExclusion = useMemo(
    () => getAccumulatedExclusionNumbers({ previousDrawRows }),
    [previousDrawRows],
  );

  const selectedMainNumbers = useMemo(() => {
    if (selectedWinningNumber) {
      return [
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
      ];
    }
    if (previousDrawRows.length === 0) return [];
    // 미추첨 회차에서는 선택 회차-1(마지막 행)의 본번호를 기준값으로 사용해 하단 분석을 유지한다.
    const latestPreviousDraw = previousDrawRows[previousDrawRows.length - 1];
    return [
      latestPreviousDraw.num1,
      latestPreviousDraw.num2,
      latestPreviousDraw.num3,
      latestPreviousDraw.num4,
      latestPreviousDraw.num5,
      latestPreviousDraw.num6,
    ];
  }, [previousDrawRows, selectedWinningNumber]);

  const {
    adoptedByChiSquareNumbers,
    excludedByChiSquareWalkForwardConditionalPct,
    excludedByChiSquareWalkForwardOverlapRounds,
  } = useMemo(
    () => {
      const slice = getChiSquareFinalPickSlice({
        previousDrawRows,
        selectedMainNumbers,
        excludedByStreakNumbers,
        accumulatedExclusionNumbers: accumulatedExclusion.excludedUnique,
      });
      return {
        adoptedByChiSquareNumbers: slice.adopted,
        excludedByChiSquareWalkForwardConditionalPct: slice.walkForwardExcludedByConditionalPct,
        excludedByChiSquareWalkForwardOverlapRounds: slice.walkForwardExcludedByOverlapRounds,
      };
    },
    [accumulatedExclusion, excludedByStreakNumbers, previousDrawRows, selectedMainNumbers],
  );

  const { comprehensiveChartCounts, comprehensiveChartAnalyzedDrawCount } = useMemo(() => {
    if (previousDrawRows.length === 0) {
      return { comprehensiveChartCounts: [] as number[], comprehensiveChartAnalyzedDrawCount: 0 };
    }
    return {
      comprehensiveChartCounts: buildNumberCounts(previousDrawRows),
      comprehensiveChartAnalyzedDrawCount: previousDrawRows.length,
    };
  }, [previousDrawRows]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const response = await fetch(drawNumbersApiUrl(), {
          signal: abortController.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        const data: unknown = await response.json();
        const draws = normalizeDrawNumbers(data);
        if (draws.length === 0) throw new Error('Draw numbers response does not contain valid draws');
        if (!isMounted) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => {
          if (!prev) return String(draws[0]);
          const prevDraw = Number(prev);
          const hasPrevDraw = Number.isInteger(prevDraw) && draws.includes(prevDraw);
          return hasPrevDraw ? prev : String(draws[0]);
        });
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setIsLoadingDraws(false);
      }
    };

    void loadDrawNumbers();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const resetSelectedWinning = () => {
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
  };

  const handleSearch = async () => {
    if (!selectedDraw) return;
    const drawNo = Number(selectedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetSelectedWinning();
      setPreviousDrawRows([]);
      return;
    }

    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    try {
      if (drawNo === 1) {
        const response = await fetch(finalPickApiUrl(`winning-number?draw_no=${drawNo}`));
        if (!response.ok) {
          if (response.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
          throw new Error(`Failed to fetch winning number: ${response.status}`);
        }
        const data: unknown = await response.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        setPreviousDrawRows([]);
        return;
      }

      const [winningNumberRes, rangeRes] = await Promise.all([
        fetch(finalPickApiUrl(`winning-number?draw_no=${drawNo}`)),
        fetch(finalPickApiUrl(`winning-numbers-range?draw_no=${drawNo}`)),
      ]);

      if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
      const rangeData: unknown = await rangeRes.json();
      if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');

      const rows = rangeData.filter(isWinningNumberRow);
      setPreviousDrawRows(rows);

      if (winningNumberRes.ok) {
        const winningData: unknown = await winningNumberRes.json();
        if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(winningData);
        setWinningNumberError(null);
      } else if (winningNumberRes.status === 404) {
        setSelectedWinningNumber(null);
        setWinningNumberError('해당 회차는 아직 당첨번호가 확정되지 않았습니다.');
      } else {
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
    } catch (error) {
      console.error('Error fetching final-pick winning number:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetSelectedWinning();
      setPreviousDrawRows([]);
      setSearchedDraw('');
    } finally {
      setIsSearching(false);
      setIsLoadingWinningNumber(false);
    }
  };

  return {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    previousDrawRows,
    excludedByStreakNumbers,
    accumulatedExclusion,
    adoptedByChiSquareNumbers,
    excludedByChiSquareWalkForwardConditionalPct,
    excludedByChiSquareWalkForwardOverlapRounds,
    comprehensiveChartCounts,
    comprehensiveChartAnalyzedDrawCount,
    searchedDraw,
    isSearching,
    searchError,
    handleSearch,
  };
};
