import { useEffect, useState } from 'react';
import { buildTrendResults } from '../logic/trend';
import { isWinningNumberRow } from '../logic/guards';
import type { NumberTrendResult, WinningNumberRow } from '../types';

type UseTrendDataResult = {
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
  trendResults: NumberTrendResult[];
  historyCount: number;
  handleSearch: () => Promise<void>;
};

export const useTrendData = (): UseTrendDataResult => {
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');

  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);

  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [trendResults, setTrendResults] = useState<NumberTrendResult[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/trend/draw-numbers`, {
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
    setTrendResults([]);
    setHistoryCount(0);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
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
        const res = await fetch(`${apiUrl}/api/analysis/trend/winning-number?draw_no=${drawNo}`);
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        resetResults();
        return;
      }

      const [winningNumberRes, allHistoryRes] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/trend/winning-number?draw_no=${drawNo}`),
        fetch(`${apiUrl}/api/analysis/trend/all-history?draw_no=${drawNo}`),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!allHistoryRes.ok) throw new Error(`Failed to fetch all history: ${allHistoryRes.status}`);

      const winningData: unknown = await winningNumberRes.json();
      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');

      const historyData: unknown = await allHistoryRes.json();
      if (!Array.isArray(historyData)) throw new Error('All history response is not an array');
      const allRows = historyData.filter(isWinningNumberRow);

      setSelectedWinningNumber(winningData);
      setHistoryCount(allRows.length);
      setTrendResults(buildTrendResults(allRows));
    } catch (error) {
      console.error('Error fetching trend data:', error);
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
    trendResults,
    historyCount,
    handleSearch,
  };
};
