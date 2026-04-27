'use client';

import React, { useEffect, useMemo } from 'react';
import { SimulationStats } from '@/app/home/components/SimulationStats';
import { LotteryGridControls } from '@/app/home/components/LotteryGridControls';
import { LotterySetList } from '@/app/home/components/LotterySetList';
import { useLotteryGridData } from '@/app/home/components/hooks/useLotteryGridData';
import { useSaveWinningNumbers } from '@/app/home/components/hooks/useSaveWinningNumbers';
import { useWinningNumbersInput } from '@/app/home/components/hooks/useWinningNumbersInput';
import type { LotterySetViewModel } from '@/app/home/components/types';

export function LotteryGrid() {
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  } = useWinningNumbersInput();

  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useLotteryGridData();
  const { isSaving, saveStatus, resetSaveStatus, handleSaveWinning } = useSaveWinningNumbers({
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

  const displaySets = useMemo(
    () =>
      sets.map((set) => ({
        id: set.id,
        numbers: [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6],
        method: set.method,
        drawNo: set.draw_no ?? selectedDraw ?? 0,
      })),
    [selectedDraw, sets],
  ) as LotterySetViewModel[];

  return (
    <section>
      <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative shadow-2xl overflow-visible">
        <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>
        <LotteryGridControls
          selectedDraw={selectedDraw}
          availableDraws={availableDraws}
          winningNumbers={winningNumbers}
          winningBonus={winningBonus}
          onSelectDraw={setSelectedDraw}
          onWinningNumberChange={handleWinningNumberChange}
          onBonusNumberChange={handleBonusNumberChange}
          onSaveWinning={handleSaveWinning}
          isSaving={isSaving}
          saveStatus={saveStatus}
        />
        <SimulationStats
          sets={displaySets}
          winningNumbers={winningNumbers as number[]}
          bonusNumber={winningBonus as number}
        />
        <LotterySetList sets={displaySets} />
      </div>
    </section>
  );
}

