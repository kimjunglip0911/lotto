import { useEffect, useState } from 'react';
import { buildAccumulatedCountExclusionResult } from '@/app/analysis/accu-nums/logic/accuCntExt';
import { CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS } from '../constants';
import { buildChiSquareResults } from '../logic/chiSquare';
import { isWinningNumberRow } from '../logic/guards';
import type { ChiSquareResult, WinningNumberRow } from '../types';

type UseChiSquareDataResult = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (value: string) => void;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  analyzedDrawCount: number;
  chiSquareResults: ChiSquareResult[];
  /** 통합 분석과 동일한 누적 출현 극값 제외 고유 번호(없으면 null) */
  accumulatedFinalNumbers: readonly number[] | null;
  /**
   * 워크포워드·구간 표·사용 번호 채택용: 조회 회차까지 `draw_no` 오름차순 중
   * 최근 `CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS`회만(2회차 이상 조회 성공 시만).
   */
  walkForwardRows: readonly WinningNumberRow[] | null;
  handleSearch: () => Promise<void>;
};

export const useChiSquareData = (): UseChiSquareDataResult => {
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

  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [chiSquareResults, setChiSquareResults] = useState<ChiSquareResult[]>([]);
  const [accumulatedFinalNumbers, setAccumulatedFinalNumbers] = useState<readonly number[] | null>(null);
  const [walkForwardRows, setWalkForwardRows] = useState<readonly WinningNumberRow[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/chi-square/draw-numbers`, {
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

  const resetResults = () => {
    setAnalyzedDrawCount(0);
    setChiSquareResults([]);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
    setAccumulatedFinalNumbers(null);
    setWalkForwardRows(null);
  };

  const handleSearch = async () => {
    if (!selectedDraw) return;

    const drawNo = Number(selectedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetResults();
      return;
    }

    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      if (drawNo === 1) {
        const res = await fetch(`${apiUrl}/api/analysis/chi-square/winning-number?draw_no=${drawNo}`);
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        resetResults();
        setSelectedWinningNumber(data);
        setAnalyzedDrawCount(0);
        return;
      }

      const [winningNumberRes, rangeRes] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/chi-square/winning-number?draw_no=${drawNo}`),
        fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${drawNo}`),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);

      const winningData: unknown = await winningNumberRes.json();
      const rangeData: unknown = await rangeRes.json();

      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
      if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');

      const rows = rangeData.filter(isWinningNumberRow);
      const sortedRows = [...rows].sort((a, b) => a.draw_no - b.draw_no);
      const walkForwardSource =
        sortedRows.length <= CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS
          ? sortedRows
          : sortedRows.slice(-CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS);
      const { excludedUnique } = buildAccumulatedCountExclusionResult(sortedRows);
      setAccumulatedFinalNumbers(excludedUnique.length > 0 ? [...excludedUnique] : null);

      setSelectedWinningNumber(winningData);
      setAnalyzedDrawCount(rows.length);
      setChiSquareResults(buildChiSquareResults(rows));
      setWalkForwardRows(walkForwardSource);
    } catch (error) {
      console.error('Error fetching chi-square data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetResults();
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
    searchedDraw,
    isSearching,
    searchError,
    analyzedDrawCount,
    chiSquareResults,
    accumulatedFinalNumbers,
    walkForwardRows,
    handleSearch,
  };
};
