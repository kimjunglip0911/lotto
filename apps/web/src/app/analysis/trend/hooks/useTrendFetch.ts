import { useState } from 'react';
import { loadTrendSearch, parseTrendDrawNo } from '../logic/trend/trSearch';
import type { DeviationBinsSummary, NumberTrendResult, WinningNumberRow } from '../types';

export const useTrendFetch = (selectedDraw: string) => {
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);
  const [searchedDraw, setSearchedDraw] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trendResults, setTrendResults] = useState<NumberTrendResult[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [trendBaseline, setTrendBaseline] = useState(0);
  const [deviationBinsSummary, setDeviationBinsSummary] = useState<DeviationBinsSummary | null>(null);

  const resetResults = () => {
    setTrendResults([]);
    setHistoryCount(0);
    setTrendBaseline(0);
    setDeviationBinsSummary(null);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
  };

  const handleSearch = async () => {
    const drawNo = parseTrendDrawNo(selectedDraw);
    if (drawNo === null) {
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

    try {
      const out = await loadTrendSearch(drawNo);
      if (out.kind === 'first') {
        setSelectedWinningNumber(out.winning);
        resetResults();
        return;
      }
      setSelectedWinningNumber(out.winning);
      setHistoryCount(out.historyCount);
      setTrendBaseline(out.trendBaseline);
      setTrendResults(out.trendResults);
      setDeviationBinsSummary(out.deviationBinsSummary);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      const msg =
        error instanceof Error && error.message.includes('당첨번호')
          ? error.message
          : '조회 데이터를 불러오지 못했습니다.';
      setSearchError(msg);
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
    winningNumberError,
    searchedDraw,
    isSearching,
    searchError,
    trendResults,
    historyCount,
    trendBaseline,
    deviationBinsSummary,
    handleSearch,
  };
};
