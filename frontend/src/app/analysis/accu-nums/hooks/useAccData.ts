/** 누적 번호 페이지 데이터 훅 — 회차 목록·조회 훅을 한 객체로 묶어보낸다. */

import { useAccDrawList } from './useAccDrawList';
import { useAccSrch } from './useAccSrch';

export const useAccData = () => {
  const draws = useAccDrawList();

  const srch = useAccSrch({
    selectedDraw: draws.selectedDraw,
  });

  return {
    availableDraws: draws.availableDraws,
    selectedDraw: draws.selectedDraw,
    setSelectedDraw: draws.setSelectedDraw,
    searchedDraw: srch.searchedDraw,
    isLoadingDraws: draws.isLoadingDraws,
    drawLoadError: draws.drawLoadError,
    isSearching: srch.isSearching,
    searchError: srch.searchError,
    selectedWinningNumber: srch.selectedWinningNumber,
    isLoadingSelectedWinningNumber: srch.isLoadingSelectedWinningNumber,
    selectedWinningNumberError: srch.selectedWinningNumberError,
    allTimeCountResult: srch.allTimeCountResult,
    accumulatedCountExclusion: srch.accumulatedCountExclusion,
    handleSearch: srch.handleSearch,
  };
};

export type AccuData = ReturnType<typeof useAccData>;
