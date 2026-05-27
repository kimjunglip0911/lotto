import { useCallback, useRef, useState } from 'react';
import { fetchFinalPickWinSearch } from '../api/win/winByDraw';
import type { WinningNumberRow } from '../types/winRow';

type Opts = { selectedDraw: string };

/** 통합 분석 — 회차 조회·당첨·이전 회차 행. */
export const useFinalPickSrch = ({ selectedDraw }: Opts) => {
  const searchSessionRef = useRef(0);
  const [searchedDraw, setSearchedDraw] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);
  const [previousDrawRows, setPreviousDrawRows] = useState<WinningNumberRow[]>([]);

  const resetWinning = useCallback(() => {
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
    setPreviousDrawRows([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedDraw) return;
    const drawNo = Number(selectedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetWinning();
      return;
    }

    const session = ++searchSessionRef.current;
    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    try {
      const out = await fetchFinalPickWinSearch(drawNo);
      if (session !== searchSessionRef.current) return;
      if (out.kind === 'draw1') {
        setSelectedWinningNumber(out.winningNumber);
        setPreviousDrawRows([]);
        setWinningNumberError(null);
        return;
      }
      setPreviousDrawRows(out.previousDrawRows);
      setSelectedWinningNumber(out.winningNumber);
      setWinningNumberError(out.winningNumberError);
    } catch (error) {
      console.error('Error fetching final-pick winning number:', error);
      if (session === searchSessionRef.current) {
        setSearchError('조회 데이터를 불러오지 못했습니다.');
        resetWinning();
        setSearchedDraw('');
      }
    } finally {
      if (session === searchSessionRef.current) {
        setIsSearching(false);
        setIsLoadingWinningNumber(false);
      }
    }
  }, [resetWinning, selectedDraw]);

  return {
    searchedDraw,
    isSearching,
    searchError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    previousDrawRows,
    handleSearch,
  };
};
