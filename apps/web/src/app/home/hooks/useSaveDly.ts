/**
 * 홈 화면에서 저장 성공·실패 안내 문구가 화면에 남는 시간을 다루는 훅입니다.
 *
 * 하는 일
 * - 저장 결과(성공·실패)를 잠시 보여 준 뒤, 정해진 시간이 지나면 "대기" 상태로 되돌립니다.
 * - 새 저장 결과가 오면 이전에 예약해 둔 되돌리기를 취소하고 다시 예약합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 없음
 * - 돌려줌: `scheduleReset` — 화면 상태를 바꾸는 함수를 넘기면, 지연 후 "대기"로 바꾸도록 예약합니다.
 *
 * 역할 나눔
 * - 저장 요청·상태 보관: `hooks/useSaveWinning.ts`
 * - 되돌리기까지 걸리는 시간: `constants/home.ts`의 `SAVE_STATUS_RESET_DELAY_MS`
 *
 * 실패·주의
 * - 화면을 떠날 때 예약을 모두 지워, 늦게 문구가 바뀌거나 불필요한 동작이 남지 않게 합니다.
 * - 연속 저장 시 마지막 결과 기준으로만 되돌리기가 예약됩니다.
 */

import { useCallback, useEffect, useRef } from 'react';

import { SAVE_STATUS_RESET_DELAY_MS } from '../constants/home';
import type { SaveStatus } from '../types/home';

export const useSaveDly = () => {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const scheduleReset = useCallback((setStatus: (s: SaveStatus) => void) => {
    clearTimer();
    saveTimerRef.current = setTimeout(
      () => setStatus('idle'),
      SAVE_STATUS_RESET_DELAY_MS,
    );
  }, []);

  return { scheduleReset };
};
