import { useCallback, useRef, useState } from 'react';
import { execChiSearch } from '../logic/execChiSrch';
import { parseSelDraw } from '../logic/parseSelDraw';
import type { ChiSquareResult, WinningNumberRow } from '../types';

type Opts = { selectedDraw: string };

export const useChiSquareSrch = ({ selectedDraw }: Opts) => {
  const searchSessionRef = useRef(0);
  const [searchedDraw, setSearchedDraw] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);
  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [chiSquareResults, setChiSquareResults] = useState<ChiSquareResult[]>([]);
  const [walkForwardRows, setWalkForwardRows] = useState<readonly WinningNumberRow[] | null>(null);

  const resetResults = useCallback(() => {
    setAnalyzedDrawCount(0);
    setChiSquareResults([]);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
    setWalkForwardRows(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedDraw) return;
    const drawNo = parseSelDraw(selectedDraw);
    if (drawNo === null) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetResults();
      return;
    }

    const session = ++searchSessionRef.current;
    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    try {
      const out = await execChiSearch(drawNo, session, searchSessionRef);
      if (!out) return;
      if (out.kind === 'draw1') {
        resetResults();
        setSelectedWinningNumber(out.winningNumber);
        setAnalyzedDrawCount(0);
        return;
      }
      setSelectedWinningNumber(out.winningNumber);
      setAnalyzedDrawCount(out.analyzedDrawCount);
      setChiSquareResults(out.chiSquareResults);
      setWalkForwardRows(out.walkForwardRows);
    } catch (error) {
      console.error('Error fetching chi-square data:', error);
      if (session === searchSessionRef.current) {
        setSearchError('조회 데이터를 불러오지 못했습니다.');
        resetResults();
        setSearchedDraw('');
      }
    } finally {
      if (session === searchSessionRef.current) {
        setIsSearching(false);
        setIsLoadingWinningNumber(false);
      }
    }
  }, [resetResults, selectedDraw]);

  return {
    searchedDraw,
    isSearching,
    searchError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    analyzedDrawCount,
    chiSquareResults,
    walkForwardRows,
    handleSearch,
  };
};
