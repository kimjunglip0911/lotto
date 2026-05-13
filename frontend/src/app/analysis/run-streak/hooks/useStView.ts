import { useMemo } from 'react';
import { getMaxStreak } from '../logic/streak';
import { buildStatusMessage } from '../logic/hintLine';
import type { StreakResult } from '../types';

// 조회된 데이터를 카드·표·상단 안내 문구에 맞게 가공한 값만 돌려 줍니다.

type Params = {
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
}: Params) => {
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
