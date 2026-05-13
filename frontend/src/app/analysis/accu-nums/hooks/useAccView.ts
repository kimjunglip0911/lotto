/** 화면용 파생값(안내 문구)만 만든다. */

import { useMemo } from 'react';

import { accStatusMsg } from '../logic/accStatusMsg';
import type { AccViewIn } from '../logic/accViewIn';
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
      mainWinSet: new Set(selectedMainNumbers),
    };
  }, [selectedWinningNumber]);
  return {
    hasSearched,
    selectedSearchDrawNo,
    ...winBundle,
    statusMessage,
  };
};

export type AccuView = ReturnType<typeof useAccView>;
