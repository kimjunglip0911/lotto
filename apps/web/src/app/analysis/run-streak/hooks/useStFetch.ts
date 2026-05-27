import { useState } from 'react';
import { loadStreakSearch, parseStDrawNo } from '../logic/streak/stSearch';
import type { StreakResult, WinningNumberRow } from '../types';

export const useStFetch = (selectedDraw: string) => {
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [searchedDraw, setSearchedDraw] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [streakResults, setStreakResults] = useState<StreakResult[]>([]);

  const resetResults = () => {
    setAnalyzedDrawCount(0);
    setStreakResults([]);
    setSelectedWinningNumber(null);
  };

  const handleSearch = async () => {
    const drawNo = parseStDrawNo(selectedDraw);
    if (drawNo === null) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetResults();
      return;
    }
    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setSearchedDraw(selectedDraw);
    try {
      const out = await loadStreakSearch(drawNo);
      if (out.kind === 'first') {
        resetResults();
        setSelectedWinningNumber(out.winning);
        return;
      }
      setSelectedWinningNumber(out.winning);
      setAnalyzedDrawCount(out.analyzedDrawCount);
      setStreakResults(out.streakResults);
    } catch (error) {
      console.error('Error fetching consecutive appearance data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetResults();
      setSearchedDraw('');
    } finally {
      setIsSearching(false);
      setIsLoadingWinningNumber(false);
    }
  };

  return {
    selectedWinningNumber,
    isLoadingWinningNumber,
    searchedDraw,
    isSearching,
    searchError,
    analyzedDrawCount,
    streakResults,
    handleSearch,
  };
};
