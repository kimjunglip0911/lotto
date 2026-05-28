/**
 * 홈 화면에서 당첨번호 저장 버튼과 저장 결과 안내를 다루는 훅입니다.
 *
 * 하는 일
 * - 저장 버튼을 누르면 서버에 당첨번호를 보냅니다.
 * - 저장 중·성공·실패 상태를 잠시 화면에 보여 줍니다.
 * - 회차를 바꾸면 이전 저장 결과 문구를 지웁니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `selectedDraw`, `winningNumbers`, `winningBonus`
 * - 돌려줌: `isSaving`, `saveStatus`, `saveWinning`(저장 실행)
 *
 * 역할 나눔
 * - 입력 값: `hooks/useWinInput.ts`
 * - 서버 전송: `api/win/saveWin.ts`
 * - 저장 결과 되돌리기 예약: `hooks/useSaveDly.ts`
 * - 화면 조합: `hooks/useHomeView.ts`
 *
 * 실패·주의
 * - 회차가 선택되지 않으면 저장을 하지 않습니다.
 * - 네트워크·서버 오류 시 실패 안내가 잠시 표시됩니다.
 */

import { useCallback, useState } from 'react';

import { saveWin } from '../api/win/saveWin';
import { makeSaveBody } from '../logic/saveBody';
import type { InputNumber, SaveStatus } from '../types/home';
import { useSaveDly } from './useSaveDly';

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
  const [lastDraw, setLastDraw] = useState(selectedDraw);
  const { scheduleReset } = useSaveDly();

  if (selectedDraw !== lastDraw) {
    setLastDraw(selectedDraw);
    setSaveStatus('idle');
  }

  const setResult = useCallback(
    (status: 'success' | 'error') => {
      setSaveStatus(status);
      scheduleReset(setSaveStatus);
    },
    [scheduleReset],
  );

  const saveWinning = useCallback(async () => {
    if (selectedDraw === null) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const body = makeSaveBody(selectedDraw, winningNumbers, winningBonus);
      setResult((await saveWin(body)) ? 'success' : 'error');
    } catch {
      setResult('error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDraw, setResult, winningNumbers, winningBonus]);

  return { isSaving, saveStatus, saveWinning };
};
