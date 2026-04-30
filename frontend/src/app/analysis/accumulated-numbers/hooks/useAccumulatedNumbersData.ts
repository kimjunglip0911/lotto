import { useEffect, useState } from 'react';
import {
  fetchDrawNumbers,
  fetchWinningNumberByDraw,
  fetchWinningNumbersRange,
  fetchWinningNumbersWindow,
} from '../api';
import { WINDOW_CONFIGS } from '../constants';
import {
  buildWindowCountResultMap,
  createEmptyCountResult,
  createEmptyWindowCountMap,
  toCountResult,
} from '../logic/numberCounts';
import type { CountResult, WinningNumberRow, WindowCountResultMap } from '../types';

const parseSelectedDrawNo = (selectedDraw: string) => {
  const selectedDrawNo = Number(selectedDraw);
  if (!Number.isInteger(selectedDrawNo) || selectedDrawNo < 1) {
    return null;
  }
  return selectedDrawNo;
};

export const useAccumulatedNumbersData = () => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState('');
  const [searchedDraw, setSearchedDraw] = useState('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingSelectedWinningNumber, setIsLoadingSelectedWinningNumber] = useState(false);
  const [selectedWinningNumberError, setSelectedWinningNumberError] = useState<string | null>(null);
  const [allTimeCountResult, setAllTimeCountResult] = useState<CountResult>(() => createEmptyCountResult());
  const [windowCountResultMap, setWindowCountResultMap] = useState<WindowCountResultMap>(() =>
    createEmptyWindowCountMap()
  );

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const draws = await fetchDrawNumbers(abortController.signal);
        if (!isMounted) {
          return;
        }

        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) {
          return;
        }

        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setIsLoadingDraws(false);
        }
      }
    };

    void loadDrawNumbers();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const resetSearchResults = (options?: { clearWinningNumber?: boolean }) => {
    setAllTimeCountResult(createEmptyCountResult());
    setWindowCountResultMap(createEmptyWindowCountMap());

    if (options?.clearWinningNumber) {
      setSelectedWinningNumber(null);
    }
  };

  const initializeSearchState = (draw: string) => {
    setIsSearching(true);
    setIsLoadingSelectedWinningNumber(true);
    setSearchError(null);
    setSelectedWinningNumberError(null);
    setSearchedDraw(draw);
  };

  const setSearchFailureState = () => {
    setSearchError('조회 데이터를 불러오지 못했습니다.');
    resetSearchResults({ clearWinningNumber: true });
    setSelectedWinningNumberError('선택한 회차의 당첨번호를 불러오지 못했습니다.');
  };

  const finalizeSearchState = () => {
    setIsSearching(false);
    setIsLoadingSelectedWinningNumber(false);
  };

  const executeSearch = async (selectedDrawNo: number) => {
    if (selectedDrawNo === 1) {
      const winningNumber = await fetchWinningNumberByDraw(selectedDrawNo);
      setSelectedWinningNumber(winningNumber);
      resetSearchResults();
      return;
    }

    const [rangeRows, winningNumber, ...windowRows] = await Promise.all([
      fetchWinningNumbersRange(selectedDrawNo),
      fetchWinningNumberByDraw(selectedDrawNo),
      ...WINDOW_CONFIGS.map((config) => fetchWinningNumbersWindow(selectedDrawNo, config.windowSize)),
    ]);

    setAllTimeCountResult(toCountResult(rangeRows));
    setWindowCountResultMap(buildWindowCountResultMap(windowRows));
    setSelectedWinningNumber(winningNumber);
  };

  const handleSearch = async () => {
    if (!selectedDraw) {
      return;
    }

    const selectedDrawNo = parseSelectedDrawNo(selectedDraw);
    if (selectedDrawNo === null) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetSearchResults({ clearWinningNumber: true });
      return;
    }

    initializeSearchState(selectedDraw);

    try {
      await executeSearch(selectedDrawNo);
    } catch (error) {
      console.error('Error fetching accumulated numbers search data:', error);
      setSearchFailureState();
    } finally {
      finalizeSearchState();
    }
  };

  return {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    searchedDraw,
    isLoadingDraws,
    drawLoadError,
    isSearching,
    searchError,
    selectedWinningNumber,
    isLoadingSelectedWinningNumber,
    selectedWinningNumberError,
    allTimeCountResult,
    windowCountResultMap,
    handleSearch,
  };
};
