'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimulationStats } from '@/app/home/components/SimulationStats';
import { LotteryGridControls } from '@/app/home/components/LotteryGridControls';
import { LotterySetList } from '@/app/home/components/LotterySetList';
import { useLotteryGridData } from '@/app/home/components/hooks/useLotteryGridData';
import { useWinningNumbersInput } from '@/app/home/components/hooks/useWinningNumbersInput';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function LotteryGrid() {
  const {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  } = useWinningNumbersInput();

  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useLotteryGridData();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWinningNumbersFromDraw(winningByDraw);
  }, [setWinningNumbersFromDraw, winningByDraw]);

  useEffect(() => {
    setSaveStatus('idle');
  }, [selectedDraw]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSaveWinning = useCallback(async () => {
    if (!selectedDraw) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const body = {
        draw_no: Number(selectedDraw),
        num1: winningNumbers[0],
        num2: winningNumbers[1],
        num3: winningNumbers[2],
        num4: winningNumbers[3],
        num5: winningNumbers[4],
        num6: winningNumbers[5],
        bonus_num: winningBonus,
      };

      const res = await fetch(`${API_BASE}/api/drawings/save-winning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('저장 실패');

      setSaveStatus('success');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [selectedDraw, winningNumbers, winningBonus]);

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
          onSaveWinning={handleSaveWinning}
          isSaving={isSaving}
          saveStatus={saveStatus}
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

