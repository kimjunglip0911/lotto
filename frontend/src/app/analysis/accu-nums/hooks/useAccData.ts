import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchDrawNumbers,
  fetchWinningNumberByDraw,
  fetchWinningNumbersRange,
  fetchWinningNumbersWindow,
  saveAccumulatedNumbersSnapshot,
} from '../api';
import { WINDOW_CONFIGS } from '../constants';
import {
  buildWindowCountResultMap,
  createEmptyCountResult,
  createEmptyWindowCountMap,
  toCountResult,
} from '../logic/numberCounts';
import {
  buildAccumulatedCountExclusionResult,
  type AccumulatedCountExclusionResult,
} from '../logic/accumulatedCountExtremes';
import { runAccumulatedStrategySelection } from '../logic/runAccumulatedStrategySelection';
import type {
  CountResult,
  FinalNumberPlan,
  StrategyChartData,
  WinningNumberRow,
  WindowCountResultMap,
} from '../types';

const parseSelectedDrawNo = (selectedDraw: string) => {
  const selectedDrawNo = Number(selectedDraw);
  if (!Number.isInteger(selectedDrawNo) || selectedDrawNo < 1) {
    return null;
  }
  return selectedDrawNo;
};

export const useAccData = () => {
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
  const [strategyCharts, setStrategyCharts] = useState<StrategyChartData[]>([]);
  const [finalNumberPlan, setFinalNumberPlan] = useState<FinalNumberPlan | null>(null);
  const [accumulatedCountExclusion, setAccumulatedCountExclusion] =
    useState<AccumulatedCountExclusionResult | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [saveSnapshotMessage, setSaveSnapshotMessage] = useState<string | null>(null);
  const [saveSnapshotError, setSaveSnapshotError] = useState<string | null>(null);

  /** 조회 버튼을 연속으로 누를 때 늦게 도착한 이전 요청이 상태를 덮어쓰지 않도록 구분한다. */
  const searchSessionRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const draws = await fetchDrawNumbers({ signal: abortController.signal });
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
    setStrategyCharts([]);
    setFinalNumberPlan(null);
    setAccumulatedCountExclusion(null);

    if (options?.clearWinningNumber) {
      setSelectedWinningNumber(null);
    }
  };

  const initializeSearchState = (draw: string) => {
    setIsSearching(true);
    setIsLoadingSelectedWinningNumber(true);
    setSearchError(null);
    setSelectedWinningNumberError(null);
    setSaveSnapshotMessage(null);
    setSaveSnapshotError(null);
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

  const executeSearch = async (selectedDrawNo: number, session: number) => {
    const isStale = () => session !== searchSessionRef.current;

    if (selectedDrawNo === 1) {
      const winningNumber = await fetchWinningNumberByDraw(selectedDrawNo);
      if (isStale()) {
        return;
      }
      setSelectedWinningNumber(winningNumber);
      resetSearchResults();
      return;
    }

    const [rangeRows, winningNumber, ...windowRows] = await Promise.all([
      fetchWinningNumbersRange(selectedDrawNo),
      fetchWinningNumberByDraw(selectedDrawNo),
      ...WINDOW_CONFIGS.map((config) => fetchWinningNumbersWindow(selectedDrawNo, config.windowSize)),
    ]);

    if (isStale()) {
      return;
    }

    setAllTimeCountResult(toCountResult(rangeRows));
    setWindowCountResultMap(buildWindowCountResultMap(windowRows));
    setSelectedWinningNumber(winningNumber);
    setAccumulatedCountExclusion(buildAccumulatedCountExclusionResult(rangeRows));

    const { strategyCharts, finalNumberPlan } = runAccumulatedStrategySelection(rangeRows);
    setStrategyCharts(strategyCharts);
    setFinalNumberPlan(finalNumberPlan);
  };

  const saveAccumulatedSnapshot = useCallback(async () => {
    setSaveSnapshotMessage(null);
    setSaveSnapshotError(null);
    const anchor = parseSelectedDrawNo(searchedDraw);
    if (anchor === null || anchor <= 1) {
      setSaveSnapshotError('회차 2 이상 조회 후에만 저장할 수 있습니다.');
      return;
    }

    if (!finalNumberPlan || finalNumberPlan.finalNumbers.length !== 4) {
      setSaveSnapshotError('최종 채택 4개 번호가 계산된 뒤에만 저장할 수 있습니다.');
      return;
    }

    setIsSavingSnapshot(true);
    try {
      const quad = finalNumberPlan.finalNumbers as [number, number, number, number];
      const res = await saveAccumulatedNumbersSnapshot(anchor, quad);
      setSaveSnapshotMessage(res.message);
    } catch (error) {
      console.error('Error saving accumulated snapshot:', error);
      setSaveSnapshotError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSavingSnapshot(false);
    }
  }, [searchedDraw, finalNumberPlan]);

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

    const session = ++searchSessionRef.current;
    initializeSearchState(selectedDraw);

    try {
      await executeSearch(selectedDrawNo, session);
    } catch (error) {
      console.error('Error fetching accumulated numbers search data:', error);
      if (session === searchSessionRef.current) {
        setSearchFailureState();
      }
    } finally {
      if (session === searchSessionRef.current) {
        finalizeSearchState();
      }
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
    strategyCharts,
    finalNumberPlan,
    accumulatedCountExclusion,
    handleSearch,
    saveAccumulatedSnapshot,
    isSavingSnapshot,
    saveSnapshotMessage,
    saveSnapshotError,
  };
};
