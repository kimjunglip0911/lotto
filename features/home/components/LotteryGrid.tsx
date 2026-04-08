'use client';

import React, { useMemo } from 'react';
import { SimulationStats } from '@features/home/components/SimulationStats';
import { LotteryGridControls } from '@features/home/components/LotteryGridControls';
import { LotterySetList } from '@features/home/components/LotterySetList';
import { useLotteryGridData } from '@features/home/components/hooks/useLotteryGridData';
import { useWinningNumbersInput } from '@features/home/components/hooks/useWinningNumbersInput';

export function LotteryGrid() {
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    resetWinningInputs,
  } = useWinningNumbersInput();

  const { sets, availableDraws, selectedDraw, setSelectedDraw } = useLotteryGridData({
    onDrawChange: resetWinningInputs,
  });

  const mappedSets = useMemo(
    () =>
      sets.map((set) => ({
        numbers: [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6],
        method: set.method,
        drawNo: set.draw_no || Number(selectedDraw),
      })),
    [selectedDraw, sets],
  );

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
        />
        <LotterySetList sets={mappedSets} />
      </div>
      <SimulationStats
        sets={mappedSets}
        winningNumbers={winningNumbers as number[]}
        bonusNumber={winningBonus as number}
      />
    </section>
  );
}

