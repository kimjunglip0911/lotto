import { useEffect, useMemo, useState } from 'react';
import { isWinningNumberRow, type WinningNumberRow } from '../types';
import { getTrendExcludedNumbers } from '../logic/trendExclusion';
import { getAccumulatedAdoptedNumbers } from '../logic/accumulatedAdoption';
import {
  buildChiSquareChartData,
  getChiSquareFinalPickSlice,
  type ChiSquareChartDatum,
} from '../logic/chiSquareAdoption';
import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/absence-streak/logic/streak';

/**
 * 통합 분석 페이지의 회차 목록·당첨번호 조회 훅.
 *
 * - 통합 분석 전용 백엔드 라우터는 후속 작업에서 도입하며,
 *   현재는 가장 가벼운 `absence-streak` 라우터를 재사용한다.
 * - URL 호출은 본 훅 내부에서만 수행하므로 후속 교체 시 한 곳만 바꾸면 된다.
 */
const finalPickApiUrl = (pathWithQuery: string): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/api/analysis/absence-streak/${pathWithQuery}`;
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
  excludedByTrendNumbers: number[];
  excludedByStreakNumbers: number[];
  adoptedByAccumulatedNumbers: number[];
  adoptedByChiSquareNumbers: number[];
  /** 워크포워드 — 조건부 확률(%) 이하로 제외되는 번호(통합 페이지 카드) */
  excludedByChiSquareWalkForwardConditionalPct: number[];
  /** 워크포워드 — 겹침 회차 이하로 제외되는 번호(통합 페이지 카드) */
  excludedByChiSquareWalkForwardOverlapRounds: number[];
  chiSquareChartData: ChiSquareChartDatum[];
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
  const [excludedByTrendNumbers, setExcludedByTrendNumbers] = useState<number[]>([]);
  const excludedByStreakNumbers = useMemo(() => {
    if (previousDrawRows.length === 0) return [];
    const drawNo = Number(searchedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 2) return [];
    return getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo);
  }, [previousDrawRows, searchedDraw]);

  const adoptedByAccumulatedNumbers = useMemo(
    () =>
      getAccumulatedAdoptedNumbers({
        previousDrawRows,
        excludedByStreakNumbers,
        excludedByTrendNumbers,
      }).finalNumbers,
    [excludedByStreakNumbers, excludedByTrendNumbers, previousDrawRows],
  );

  const selectedMainNumbers = useMemo(() => {
    if (!selectedWinningNumber) return [];
    return [
      selectedWinningNumber.num1,
      selectedWinningNumber.num2,
      selectedWinningNumber.num3,
      selectedWinningNumber.num4,
      selectedWinningNumber.num5,
      selectedWinningNumber.num6,
    ];
  }, [selectedWinningNumber]);

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
        excludedByTrendNumbers,
        adoptedByAccumulatedNumbers,
      });
      return {
        adoptedByChiSquareNumbers: slice.adopted,
        excludedByChiSquareWalkForwardConditionalPct: slice.walkForwardExcludedByConditionalPct,
        excludedByChiSquareWalkForwardOverlapRounds: slice.walkForwardExcludedByOverlapRounds,
      };
    },
    [
      adoptedByAccumulatedNumbers,
      excludedByStreakNumbers,
      excludedByTrendNumbers,
      previousDrawRows,
      selectedMainNumbers,
    ],
  );

  const chiSquareChartData = useMemo(
    () => buildChiSquareChartData(previousDrawRows, selectedMainNumbers),
    [previousDrawRows, selectedMainNumbers],
  );

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const response = await fetch(finalPickApiUrl('draw-numbers'), {
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
        const draws = data.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
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
      setExcludedByTrendNumbers([]);
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
        setExcludedByTrendNumbers([]);
        return;
      }

      const [winningNumberRes, rangeRes, trendHistoryRes] = await Promise.all([
        fetch(finalPickApiUrl(`winning-number?draw_no=${drawNo}`)),
        fetch(finalPickApiUrl(`winning-numbers-range?draw_no=${drawNo}`)),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/analysis/trend/all-history?draw_no=${drawNo}`),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
      if (!trendHistoryRes.ok) throw new Error(`Failed to fetch trend history: ${trendHistoryRes.status}`);

      const winningData: unknown = await winningNumberRes.json();
      const rangeData: unknown = await rangeRes.json();
      const trendHistoryData: unknown = await trendHistoryRes.json();

      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
      if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');
      if (!Array.isArray(trendHistoryData)) throw new Error('Trend history response is not an array');

      const rows = rangeData.filter(isWinningNumberRow);
      const trendRows = trendHistoryData.filter(isWinningNumberRow);
      setSelectedWinningNumber(winningData);
      setPreviousDrawRows(rows);
      setExcludedByTrendNumbers(getTrendExcludedNumbers(trendRows));
    } catch (error) {
      console.error('Error fetching final-pick winning number:', error);
      setSearchError(
        error instanceof Error && error.message.includes('찾을 수 없습니다')
          ? error.message
          : '조회 데이터를 불러오지 못했습니다.',
      );
      resetSelectedWinning();
      setPreviousDrawRows([]);
      setExcludedByTrendNumbers([]);
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
    excludedByTrendNumbers,
    excludedByStreakNumbers,
    adoptedByAccumulatedNumbers,
    adoptedByChiSquareNumbers,
    excludedByChiSquareWalkForwardConditionalPct,
    excludedByChiSquareWalkForwardOverlapRounds,
    chiSquareChartData,
    searchedDraw,
    isSearching,
    searchError,
    handleSearch,
  };
};
