import { useMemo } from 'react';
import { getMaxStreak } from '../logic/streak';
import { winningNumbersToSet, type StreakResult, type WinningNumberRow } from '../types';

type Params = {
  availableDraws: number[];
  selectedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};

/** SearchControls 상단 안내 문구 — 분기 순서와 문구는 기존 삼항 연산과 동일해야 한다. */
function buildStatusMessage(params: {
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDrawsLength: number;
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
  hasSearched: boolean;
}): string | null {
  const {
    isLoadingDraws,
    drawLoadError,
    availableDrawsLength,
    isSearching,
    selectedDraw,
    searchError,
    hasSearched,
  } = params;

  if (isLoadingDraws) return '회차 정보를 불러오는 중입니다.';
  if (drawLoadError) return `${drawLoadError} 잠시 후 다시 시도해 주세요.`;
  if (availableDrawsLength === 0) return '조회 가능한 회차 정보가 없습니다.';
  if (isSearching) return `${selectedDraw}회 기준 연속 미출현 기간을 계산하고 있습니다.`;
  if (searchError) return `${searchError} 잠시 후 다시 시도해 주세요.`;
  if (hasSearched) return null;
  return '회차를 선택한 뒤 조회 버튼을 누르면 연속 미출현 분석 결과를 표시합니다.';
}

export const useAbsenceStreakDerived = ({
  availableDraws,
  selectedDraw,
  isLoadingDraws,
  drawLoadError,
  selectedWinningNumber,
  searchedDraw,
  isSearching,
  searchError,
  streakResults,
}: Params) => {
  const hasSearched = searchedDraw !== '';
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;

  const selectedWinningNumberSet = selectedWinningNumber
    ? winningNumbersToSet(selectedWinningNumber)
    : null;

  const maxStreak = useMemo(() => getMaxStreak(streakResults), [streakResults]);

  const coldNumbers = useMemo(() => streakResults.filter((r) => r.isCold), [streakResults]);

  const canShowStreakPanels =
    hasSearched && !noHistory && !isSearching && !searchError && streakResults.length > 0;

  const statusMessage = buildStatusMessage({
    isLoadingDraws,
    drawLoadError,
    availableDrawsLength: availableDraws.length,
    isSearching,
    selectedDraw,
    searchError,
    hasSearched,
  });

  return {
    hasSearched,
    noHistory,
    selectedWinningNumberSet,
    maxStreak,
    coldNumbers,
    canShowStreakPanels,
    statusMessage,
  };
};
