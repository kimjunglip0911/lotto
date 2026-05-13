import { useMemo } from 'react';
import { getMaxStreak } from '../logic/streak';
import { buildStatusMessage } from '../logic/statusMessage';
import { winningNumbersToSet, type StreakResult, type WinningNumberRow } from '../types';

// 조회 결과를 화면 표시 형태(저빈도 후보 목록, 안내 문구 등)로 가공하는 코드입니다.
// 원본 데이터는 그대로 두고, 화면이 바로 쓸 수 있는 형태로 다듬어 돌려줍니다.

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
  const noHistory = hasSearched && Number(searchedDraw) <= 1;

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

  return { hasSearched, noHistory, selectedWinningNumberSet, maxStreak, coldNumbers, canShowStreakPanels, statusMessage };
};
