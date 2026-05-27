import { useChiSquareDrawList } from './useChiSquareDrawList';
import { useChiSquareSrch } from './useChiSquareSrch';

/** 카이제곱 페이지 데이터 훅 — 회차 목록·조회 훅을 한 객체로 묶는다. */

export const useChiSquareData = () => {
  const draws = useChiSquareDrawList();
  const srch = useChiSquareSrch({ selectedDraw: draws.selectedDraw });

  return {
    availableDraws: draws.availableDraws,
    selectedDraw: draws.selectedDraw,
    setSelectedDraw: draws.setSelectedDraw,
    isLoadingDraws: draws.isLoadingDraws,
    drawLoadError: draws.drawLoadError,
    selectedWinningNumber: srch.selectedWinningNumber,
    isLoadingWinningNumber: srch.isLoadingWinningNumber,
    winningNumberError: srch.winningNumberError,
    searchedDraw: srch.searchedDraw,
    isSearching: srch.isSearching,
    searchError: srch.searchError,
    analyzedDrawCount: srch.analyzedDrawCount,
    chiSquareResults: srch.chiSquareResults,
    walkForwardRows: srch.walkForwardRows,
    handleSearch: srch.handleSearch,
  };
};

export type ChiSquareData = ReturnType<typeof useChiSquareData>;
