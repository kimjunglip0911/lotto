import { useCallback, useEffect, useRef, useState } from 'react';
import type { InputNumber, SaveStatus } from '@/app/home/components/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const SAVE_STATUS_RESET_DELAY_MS = 2000;

function buildSaveWinningBody(
  selectedDraw: number,
  winningNumbers: InputNumber[],
  winningBonus: InputNumber,
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

interface UseSaveWinningNumbersParams {
  selectedDraw: number | null;
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
}

export const useSaveWinningNumbers = ({
  selectedDraw,
  winningNumbers,
  winningBonus,
}: UseSaveWinningNumbersParams) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus('idle');
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

  return {
    isSaving,
    saveStatus,
    resetSaveStatus,
    handleSaveWinning,
  };
};
