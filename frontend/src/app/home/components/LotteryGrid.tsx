'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimulationStats } from '@/app/home/components/SimulationStats';
import { LotteryGridControls } from '@/app/home/components/LotteryGridControls';
import { LotterySetList } from '@/app/home/components/LotterySetList';
import { useLotteryGridData } from '@/app/home/components/hooks/useLotteryGridData';
import { useWinningNumbersInput } from '@/app/home/components/hooks/useWinningNumbersInput';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const SAVE_STATUS_RESET_DELAY_MS = 2000;

function buildSaveWinningBody(
  selectedDraw: number,
  winningNumbers: (number | '')[],
  winningBonus: number | '',
) {
  return {
    draw_no: selectedDraw,
    num1: winningNumbers[0],
    num2: winningNumbers[1],
    num3: winningNumbers[2],
    num4: winningNumbers[3],
    num5: winningNumbers[4],
    num6: winningNumbers[5],
    bonus_num: winningBonus,
  };
}

export function LotteryGrid() {
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  } = useWinningNumbersInput();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDrawChange = useCallback(() => {
    setSaveStatus('idle');
  }, []);

  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useLotteryGridData({
    onDrawChange: handleDrawChange,
  });

  useEffect(() => {
    setWinningNumbersFromDraw(winningByDraw);
  }, [setWinningNumbersFromDraw, winningByDraw]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const scheduleSaveStatusReset = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVE_STATUS_RESET_DELAY_MS);
  }, []);

  const handleSaveWinning = useCallback(async () => {
    if (selectedDraw === null) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const body = buildSaveWinningBody(selectedDraw, winningNumbers, winningBonus);
      const res = await fetch(`${API_BASE}/api/drawings/save-winning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('저장 실패');

      setSaveStatus('success');
      scheduleSaveStatusReset();
    } catch {
      setSaveStatus('error');
      scheduleSaveStatusReset();
    } finally {
      setIsSaving(false);
    }
  }, [scheduleSaveStatusReset, selectedDraw, winningNumbers, winningBonus]);

  const displaySets = useMemo(
    () =>
      sets.map((set) => ({
        id: set.id,
        numbers: [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6],
        method: set.method,
        drawNo: set.draw_no ?? selectedDraw ?? 0,
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

