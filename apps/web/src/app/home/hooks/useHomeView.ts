/** 홈 그리드에 필요한 데이터·입력·저장 훅을 한곳에서 조합한다 */

import { useEffect, useMemo } from 'react';

import { toViewModel } from '../helpers/toViewModel';
import { useGridData } from './useGridData';
import { useSaveWinning } from './useSaveWinning';
import { useWinInput } from './useWinInput';

export const useHomeView = () => {
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  } = useWinInput();
  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useGridData();
  const { isSaving, saveStatus, resetSaveStatus, handleSaveWinning } = useSaveWinning({
    selectedDraw,
    winningNumbers,
    winningBonus,
  });

  useEffect(() => {
    setWinningNumbersFromDraw(winningByDraw);
  }, [setWinningNumbersFromDraw, winningByDraw]);

  useEffect(() => {
    resetSaveStatus();
  }, [resetSaveStatus, selectedDraw]);

  const displaySets = useMemo(() => toViewModel(sets, selectedDraw), [selectedDraw, sets]);

  return {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    sets,
    winningByDraw,
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isSaving,
    saveStatus,
    handleSaveWinning,
    displaySets,
  };
};

export type HomeView = ReturnType<typeof useHomeView>;
