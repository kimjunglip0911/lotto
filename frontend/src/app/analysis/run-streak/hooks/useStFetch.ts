import { useState } from 'react';
import { loadStreakSearch, parseStDrawNo } from '../logic/stSearch';
import type { StreakResult, WinningNumberRow } from '../types';

// 조회 시 서버에서 당첨번호·이전 회차를 받아 연속 출현(본번호 6개) 결과를 만들어 화면에 넘깁니다.

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
  return { selectedWinningNumber, isLoadingWinningNumber, searchedDraw, isSearching, searchError, analyzedDrawCount, streakResults, handleSearch };
};
