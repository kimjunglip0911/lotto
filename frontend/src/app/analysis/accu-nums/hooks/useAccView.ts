import { useMemo } from 'react';
import { WINDOW_CONFIGS } from '../constants';
import { createEmptyCountResult, toSelectedHighlightNumbers, toSelectedMainNumbers } from '../logic/numberCounts';
import type {
  FinalNumberPlan,
  StrategyChartData,
  WinningNumberRow,
  WindowChartData,
  WindowCountResultMap,
} from '../types';

type Params = {
  availableDraws: number[];
  selectedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  isSearching: boolean;
  searchError: string | null;
  searchedDraw: string;
  selectedWinningNumber: WinningNumberRow | null;
  windowCountResultMap: WindowCountResultMap;
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};

/** 안내 문구 — 분기 순서와 문구는 page.tsx `buildStatusMessage`와 동일해야 한다. */
function buildStatusMessage({
  isLoadingDraws,
  drawLoadError,
  availableDrawsLength,
  isSearching,
  selectedDraw,
  searchError,
  searchedDraw,
}: {
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDrawsLength: number;
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
  searchedDraw: string;
}): string | null {
  if (isLoadingDraws) {
    return '회차 정보를 불러오는 중입니다.';
  }

  if (drawLoadError) {
    return `${drawLoadError} 잠시 후 다시 시도해 주세요.`;
  }

  if (availableDrawsLength === 0) {
    return '조회 가능한 회차 정보가 없습니다.';
  }

  if (isSearching) {
    return `${selectedDraw}회 기준 누적 당첨번호를 집계하고 있습니다.`;
  }

  if (searchError) {
    return `${searchError} 잠시 후 다시 시도해 주세요.`;
  }

  if (searchedDraw) {
    return null;
  }

  return '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.';
}

export const useAccView = ({
  availableDraws,
  selectedDraw,
  isLoadingDraws,
  drawLoadError,
  isSearching,
  searchError,
  searchedDraw,
  selectedWinningNumber,
  windowCountResultMap,
  strategyCharts,
  finalNumberPlan,
}: Params) => {
  const hasSearched = searchedDraw !== '';
  const selectedSearchDrawNo = Number(searchedDraw);
  const selectedMainNumbers = toSelectedMainNumbers(selectedWinningNumber);
  const selectedHighlightNumbers = toSelectedHighlightNumbers(selectedWinningNumber);

  const statusMessage = buildStatusMessage({
    isLoadingDraws,
    drawLoadError,
    availableDrawsLength: availableDraws.length,
    isSearching,
    selectedDraw,
    searchError,
    searchedDraw,
  });

  const windowCharts: WindowChartData[] = useMemo(
    () =>
      WINDOW_CONFIGS.map((config) => {
        const result = windowCountResultMap[config.key] ?? createEmptyCountResult();
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
    hasSearched,
    selectedSearchDrawNo,
    selectedMainNumbers,
    selectedHighlightNumbers,
    statusMessage,
    windowCharts,
    strategyCharts,
    finalNumberPlan,
  };
};
