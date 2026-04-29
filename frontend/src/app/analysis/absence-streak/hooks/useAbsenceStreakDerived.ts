import { useMemo } from 'react';
import type { StreakResult, WinningNumberRow } from '../types';

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
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;

  const selectedWinningNumberSet = selectedWinningNumber
    ? new Set([
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
        selectedWinningNumber.bonus_num,
      ])
    : null;

  const maxStreak = useMemo(
    () => (streakResults.length > 0 ? Math.max(...streakResults.map((r) => r.streak)) : 0),
    [streakResults],
  );

  const coldNumbers = useMemo(() => streakResults.filter((r) => r.isCold), [streakResults]);

  const canShowStreakPanels =
    hasSearched && !noHistory && !isSearching && !searchError && streakResults.length > 0;

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 연속 미출현 기간을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 연속 미출현 분석 결과를 표시합니다.';

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
