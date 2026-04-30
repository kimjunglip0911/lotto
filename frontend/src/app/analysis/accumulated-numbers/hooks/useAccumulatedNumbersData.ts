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
  buildNumberCounts,
  createEmptyCountResult,
  createEmptyWindowCountMap,
  toCountResult,
} from '../logic/numberCounts';
import {
  BACKTEST_FOCUS_STRATEGY_KEYS,
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
  getDefaultBacktestWindowSizes,
  pickTopWindowsByStrategy,
  runAccumulatedNumbersBacktest,
  sliceWindowTail,
} from '../logic/backtestEngine';
import type {
  CountResult,
  FinalNumberPlan,
  StrategyChartData,
  StrategyNumberPick,
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
  const [strategyCharts, setStrategyCharts] = useState<StrategyChartData[]>([]);
  const [finalNumberPlan, setFinalNumberPlan] = useState<FinalNumberPlan | null>(null);

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

    const drawNumbersToEvaluate = rangeRows.map((r) => r.draw_no).filter((d) => d >= 100);
    if (drawNumbersToEvaluate.length === 0) {
      setStrategyCharts([]);
      setFinalNumberPlan(null);
      return;
    }

    const { aggregates } = runAccumulatedNumbersBacktest({
      allRowsSortedAsc: rangeRows,
      drawNumbersToEvaluate,
      windowSizes: getDefaultBacktestWindowSizes(),
      strategyKeys: BACKTEST_FOCUS_STRATEGY_KEYS,
    });

    const shortTopRaw = pickTopWindowsByStrategy(aggregates, 'nearestMean4', 2, { maxWindowSize: 120 });
    const longTopRaw = pickTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 2, { minWindowSize: 240 });
    const shortTop = shortTopRaw.length >= 2 ? shortTopRaw : pickTopWindowsByStrategy(aggregates, 'nearestMean4', 2);
    const longTop = longTopRaw.length >= 2 ? longTopRaw : pickTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 2);
    const charts: StrategyChartData[] = [...shortTop, ...longTop].map((w, idx) => {
      const nearestIndex = shortTop.findIndex((v) => v.windowSize === w.windowSize && v.strategy === w.strategy);
      const twoHotIndex = longTop.findIndex((v) => v.windowSize === w.windowSize && v.strategy === w.strategy);
      const rank = w.strategy === 'nearestMean4' ? nearestIndex + 1 : twoHotIndex + 1;
      const rows = sliceWindowTail(rangeRows, w.windowSize);
      return {
        key: `${w.strategy}-${w.windowSize}-${idx}`,
        title:
          w.strategy === 'nearestMean4'
            ? `평균근접 전략 추천 기간 ${rank} (이전 ${w.windowSize}회)`
            : `상2+하2 전략 추천 기간 ${rank} (이전 ${w.windowSize}회)`,
        counts: buildNumberCounts(rows),
        analyzedDrawCount: rows.length,
        noDataMessage: `이전 ${w.windowSize}회 데이터가 부족해 전략 차트를 표시할 수 없습니다.`,
        strategyLabel: w.strategy === 'nearestMean4' ? '평균근접' : '상2+하2',
        windowSize: w.windowSize,
        atLeastOneRate: w.atLeastOneRate,
        avgHits: w.avgHits,
        maxMissStreak: w.maxMissStreak,
      };
    });
    setStrategyCharts(charts);

    const shortRecs = shortTop
      .map((w) => {
        const agg = aggregates.find((a) => a.strategy === 'nearestMean4' && a.windowSize === w.windowSize);
        if (!agg) return null;
        return buildStrategyRecommendation({
          strategy: 'nearestMean4',
          windowSize: w.windowSize,
          allRowsBeforeSelectedDraw: rangeRows,
          aggregate: agg,
        });
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const longRecs = longTop
      .map((w) => {
        const agg = aggregates.find((a) => a.strategy === 'twoHotTwoCold' && a.windowSize === w.windowSize);
        if (!agg) return null;
        return buildStrategyRecommendation({
          strategy: 'twoHotTwoCold',
          windowSize: w.windowSize,
          allRowsBeforeSelectedDraw: rangeRows,
          aggregate: agg,
        });
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const shortRecommendation = combineStrategyRecommendations(shortRecs);
    const longRecommendation = combineStrategyRecommendations(longRecs);

    if (!shortRecommendation || !longRecommendation) {
      setFinalNumberPlan(null);
      return;
    }
    const finalSelection = buildFinalNumberSelection(shortRecommendation, longRecommendation);

    const strategyPicks: StrategyNumberPick[] = [
      {
        strategyKey: 'nearestMean4',
        strategyLabel: '평균근접',
        windowSizes: shortTop.map((w) => w.windowSize),
        numbers: shortRecommendation.numbers,
        atLeastOneRate: shortRecommendation.metrics.atLeastOneRate,
        avgHits: shortRecommendation.metrics.avgHits,
        maxMissStreak: shortRecommendation.metrics.maxMissStreak,
      },
      {
        strategyKey: 'twoHotTwoCold',
        strategyLabel: '상2+하2',
        windowSizes: longTop.map((w) => w.windowSize),
        numbers: longRecommendation.numbers,
        atLeastOneRate: longRecommendation.metrics.atLeastOneRate,
        avgHits: longRecommendation.metrics.avgHits,
        maxMissStreak: longRecommendation.metrics.maxMissStreak,
      },
    ];

    setFinalNumberPlan({
      commonNumbers: finalSelection.commonNumbers,
      finalNumbers: finalSelection.finalNumbers,
      strategyPicks,
    });
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
    strategyCharts,
    finalNumberPlan,
    handleSearch,
  };
};
