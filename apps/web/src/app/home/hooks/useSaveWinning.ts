/** 당첨번호 저장 요청과 저장 상태 피드백을 처리한다 */

import { useCallback, useState } from 'react';

import { saveWinningNumbers } from '../api/win/saveWinning';
import { buildSaveWinningBody } from '../logic/saveBody';
import type { InputNumber, SaveStatus } from '../types/home';
import { useSaveTimer } from './useSaveTimer';

interface UseSaveWinningParams {
  selectedDraw: number | null;
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
}

export const useSaveWinning = ({
  selectedDraw,
  winningNumbers,
  winningBonus,
}: UseSaveWinningParams) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const { scheduleReset } = useSaveTimer();

  const resetSaveStatus = useCallback(() => setSaveStatus('idle'), []);

  const setResult = useCallback(
    (status: 'success' | 'error') => {
      setSaveStatus(status);
      scheduleReset(setSaveStatus);
    },
    [scheduleReset],
  );

  const handleSaveWinning = useCallback(async () => {
    if (selectedDraw === null) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const body = buildSaveWinningBody(selectedDraw, winningNumbers, winningBonus);
      setResult((await saveWinningNumbers(body)) ? 'success' : 'error');
    } catch {
      setResult('error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDraw, setResult, winningNumbers, winningBonus]);

  return { isSaving, saveStatus, resetSaveStatus, handleSaveWinning };
};
