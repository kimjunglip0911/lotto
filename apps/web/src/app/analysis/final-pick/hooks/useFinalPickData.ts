import { useFinalPickDerived } from './useFinalPickDerived';
import { useFinalPickDrawList } from './useFinalPickDrawList';
import { useFinalPickSrch } from './useFinalPickSrch';

/** 통합 분석 페이지 데이터 훅 — 회차·조회·파생값 조립. */
export const useFinalPickData = () => {
  const draws = useFinalPickDrawList();
  const srch = useFinalPickSrch({ selectedDraw: draws.selectedDraw });
  const derived = useFinalPickDerived({
    previousDrawRows: srch.previousDrawRows,
    searchedDraw: srch.searchedDraw,
    selectedWinningNumber: srch.selectedWinningNumber,
  });

  return {
    availableDraws: draws.availableDraws,
    selectedDraw: draws.selectedDraw,
    setSelectedDraw: draws.setSelectedDraw,
    isLoadingDraws: draws.isLoadingDraws,
    drawLoadError: draws.drawLoadError,
    selectedWinningNumber: srch.selectedWinningNumber,
    isLoadingWinningNumber: srch.isLoadingWinningNumber,
    winningNumberError: srch.winningNumberError,
    previousDrawRows: srch.previousDrawRows,
    searchedDraw: srch.searchedDraw,
    isSearching: srch.isSearching,
    searchError: srch.searchError,
    handleSearch: srch.handleSearch,
    ...derived,
  };
};
