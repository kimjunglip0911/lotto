import { useMemo } from 'react';
import { buildStatusMessage } from '../logic/hintLine';
import { getMaxStreak } from '../logic/streak/streak';
import type { StreakResult } from '../types';

type StViewIn = {
  availableDraws: number[];
  selectedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};

export const useStView = ({
  availableDraws,
  selectedDraw,
  isLoadingDraws,
  drawLoadError,
  searchedDraw,
  isSearching,
  searchError,
  streakResults,
}: StViewIn) => {
  const hasSearched = searchedDraw !== '';
  const noHistory = hasSearched && Number(searchedDraw) <= 1;

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

  return { hasSearched, noHistory, maxStreak, coldNumbers, canShowStreakPanels, statusMessage };
};

export type StreakView = ReturnType<typeof useStView>;
