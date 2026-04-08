'use client';

import React, { useEffect, useMemo } from 'react';
import { SimulationStats } from '@features/home/components/SimulationStats';
import { LotteryGridControls } from '@features/home/components/LotteryGridControls';
import { LotterySetList } from '@features/home/components/LotterySetList';
import { useLotteryGridData } from '@features/home/components/hooks/useLotteryGridData';
import { useWinningNumbersInput } from '@features/home/components/hooks/useWinningNumbersInput';

export function LotteryGrid() {
  // #region agent log
  fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'66d4be'},body:JSON.stringify({sessionId:'66d4be',runId:'pre-fix',hypothesisId:'H4',location:'features/home/components/LotteryGrid.tsx:11',message:'LotteryGrid component executed',data:{env:process.env.NODE_ENV ?? null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  } = useWinningNumbersInput();

  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useLotteryGridData();

  useEffect(() => {
    setWinningNumbersFromDraw(winningByDraw);
  }, [setWinningNumbersFromDraw, winningByDraw]);

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
        <SimulationStats
          sets={mappedSets}
          winningNumbers={winningNumbers as number[]}
          bonusNumber={winningBonus as number}
        />
        <LotterySetList sets={mappedSets} />
      </div>
    </section>
  );
}

