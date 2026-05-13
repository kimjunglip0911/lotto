/** 누적 번호 페이지 데이터 훅 — 회차 목록·조회·스냅샷 훅을 한 객체로 묶어보낸다. */

import { useCallback, useLayoutEffect, useRef } from 'react';

import { useAccDrawList } from './useAccDrawList';
import { useAccSnap } from './useAccSnap';
import { useAccSrch } from './useAccSrch';

export const useAccData = () => {
  const snapClearRef = useRef<() => void>(() => {});
  const draws = useAccDrawList();

  const onSearchStart = useCallback(() => {
    snapClearRef.current();
  }, []);

  const srch = useAccSrch({
    selectedDraw: draws.selectedDraw,
    onSearchStart,
  });

  const snap = useAccSnap({
    searchedDraw: srch.searchedDraw,
    finalNumberPlan: srch.finalNumberPlan,
  });

  useLayoutEffect(() => {
    snapClearRef.current = snap.clearSnapMsgs;
  }, [snap.clearSnapMsgs]);

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
    windowCountResultMap: srch.windowCountResultMap,
    strategyCharts: srch.strategyCharts,
    finalNumberPlan: srch.finalNumberPlan,
    accumulatedCountExclusion: srch.accumulatedCountExclusion,
    handleSearch: srch.handleSearch,
    saveAccumulatedSnapshot: snap.saveAccumulatedSnapshot,
    isSavingSnapshot: snap.isSavingSnapshot,
    saveSnapshotMessage: snap.saveSnapshotMessage,
    saveSnapshotError: snap.saveSnapshotError,
  };
};

export type AccuData = ReturnType<typeof useAccData>;
