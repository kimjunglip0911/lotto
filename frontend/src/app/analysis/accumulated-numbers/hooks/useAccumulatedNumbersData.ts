import { useEffect, useMemo, useState } from 'react';
import { WINDOW_CONFIGS, createEmptyCounts } from '../constants';
import { buildNumberCounts, isWinningNumberRow } from '../logic/numberCounts';
import type { WinningNumberRow, WindowChartData, WindowKey } from '../types';

type CountResult = {
  counts: number[];
  analyzedDrawCount: number;
};

const EMPTY_RESULT: CountResult = {
  counts: createEmptyCounts(),
  analyzedDrawCount: 0,
};

type WindowCountResultMap = Record<WindowKey, CountResult>;

const createEmptyWindowCountMap = () =>
  Object.fromEntries(WINDOW_CONFIGS.map((config) => [config.key, { ...EMPTY_RESULT }])) as WindowCountResultMap;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

const parseNumberArrayResponse = (data: unknown, invalidMessage: string) => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter((item): item is number => typeof item === 'number');
};

const parseWinningNumberRowsResponse = (data: unknown, invalidMessage: string) => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter(isWinningNumberRow);
};

const buildWindowCountResultMap = (windowRows: WinningNumberRow[][]): WindowCountResultMap =>
  Object.fromEntries(
    WINDOW_CONFIGS.map((config, index) => {
      const rows = windowRows[index] ?? [];
      return [config.key, toCountResult(rows)];
    })
  ) as WindowCountResultMap;

const fetchWinningNumberByDraw = async (drawNo: number) => {
  const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/winning-number?draw_no=${drawNo}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw new Error(`Failed to fetch selected winning number: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isWinningNumberRow(data)) {
    throw new Error('Selected winning number response is invalid');
  }

  return data;
};

const fetchWinningNumbersRange = async (drawNo: number) => {
  const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/winning-numbers-range?draw_no=${drawNo}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers range: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers range response is not an array');
};

const fetchWinningNumbersWindow = async (drawNo: number, windowSize: number) => {
  const response = await fetch(
    `${apiUrl}/api/analysis/accumulated-numbers/winning-numbers-window?draw_no=${drawNo}&window_size=${windowSize}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers window: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers window response is not an array');
};

const toCountResult = (rows: WinningNumberRow[]): CountResult => ({
  counts: buildNumberCounts(rows),
  analyzedDrawCount: rows.length,
});

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
  const [allTimeCountResult, setAllTimeCountResult] = useState<CountResult>({ ...EMPTY_RESULT });
  const [windowCountResultMap, setWindowCountResultMap] = useState<WindowCountResultMap>(createEmptyWindowCountMap);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/draw-numbers`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        }

        const data: unknown = await response.json();
        const draws = parseNumberArrayResponse(data, 'Draw numbers response is not an array');
        if (!isMounted) return;

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
    setAllTimeCountResult({ ...EMPTY_RESULT });
    setWindowCountResultMap(createEmptyWindowCountMap());

    if (options?.clearWinningNumber) {
      setSelectedWinningNumber(null);
    }
  };

  const handleSearch = async () => {
    if (!selectedDraw) {
      return;
    }

    const selectedDrawNo = Number(selectedDraw);
    if (!Number.isInteger(selectedDrawNo) || selectedDrawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetSearchResults({ clearWinningNumber: true });
      return;
    }

    setIsSearching(true);
    setIsLoadingSelectedWinningNumber(true);
    setSearchError(null);
    setSelectedWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    try {
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
    } catch (error) {
      console.error('Error fetching accumulated numbers search data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetSearchResults({ clearWinningNumber: true });
      setSelectedWinningNumberError('선택한 회차의 당첨번호를 불러오지 못했습니다.');
    } finally {
      setIsSearching(false);
      setIsLoadingSelectedWinningNumber(false);
    }
  };

  const windowCharts: WindowChartData[] = useMemo(
    () =>
      WINDOW_CONFIGS.map((config) => {
        const result = windowCountResultMap[config.key] ?? EMPTY_RESULT;
        return {
          key: config.key,
          title: config.title,
          counts: result.counts,
          analyzedDrawCount: result.analyzedDrawCount,
          noDataMessage: config.noDataMessage,
        };
      }),
    [windowCountResultMap]
  );

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
    windowCharts,
    handleSearch,
  };
};
