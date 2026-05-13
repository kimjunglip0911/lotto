/** 화면용 파생값(안내 문구·윈도 차트·스냅샷 가능 여부)만 만든다. */

import { useMemo } from 'react';

import { WINDOW_CONFIGS } from '../constants';
import { accStatusMsg } from '../logic/accStatusMsg';
import type { AccViewIn } from '../logic/accViewIn';
import { canAccSnap } from '../logic/canSnap';
import { mapWinCharts } from '../logic/mapWinCharts';
import { toSelectedHighlightNumbers, toSelectedMainNumbers } from '../logic/numCounts';

export const useAccView = (p: AccViewIn) => {
  const {
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
  } = p;
  const hasSearched = searchedDraw !== '';
  const selectedSearchDrawNo = Number(searchedDraw);
  const statusMessage = accStatusMsg({
    isLoadingDraws,
    drawLoadError,
    availableDrawsLength: availableDraws.length,
    isSearching,
    selectedDraw,
    searchError,
    searchedDraw,
  });
  const winBundle = useMemo(() => {
    const selectedMainNumbers = toSelectedMainNumbers(selectedWinningNumber);
    return {
      selectedMainNumbers,
      selectedHighlightNumbers: toSelectedHighlightNumbers(selectedWinningNumber),
      windowCharts: mapWinCharts(WINDOW_CONFIGS, windowCountResultMap),
      mainWinSet: new Set(selectedMainNumbers),
    };
  }, [windowCountResultMap, selectedWinningNumber]);
  const canSaveSnapshot = useMemo(
    () =>
      canAccSnap(
        hasSearched,
        isSearching,
        searchError,
        selectedSearchDrawNo,
        finalNumberPlan?.finalNumbers.length
      ),
    [hasSearched, isSearching, searchError, selectedSearchDrawNo, finalNumberPlan]
  );
  return {
    hasSearched,
    selectedSearchDrawNo,
    ...winBundle,
    statusMessage,
    strategyCharts,
    finalNumberPlan,
    canSaveSnapshot,
  };
};

export type AccuView = ReturnType<typeof useAccView>;
