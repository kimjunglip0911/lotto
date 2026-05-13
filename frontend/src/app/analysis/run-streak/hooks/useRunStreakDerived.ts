import { useMemo } from 'react';
import { getMaxStreak } from '../logic/streak';
import { buildStatusMessage } from '../logic/statusMessage';
import type { StreakResult } from '../types';

// 조회 결과를 화면 표시 형태(평균 초과 연속 출현 목록, 안내 문구 등)로 가공하는 코드입니다.
// 원본 데이터는 그대로 두고, 화면이 바로 쓸 수 있는 형태로 다듬어 돌려줍니다.

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

export const useRunStreakDerived = ({
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
