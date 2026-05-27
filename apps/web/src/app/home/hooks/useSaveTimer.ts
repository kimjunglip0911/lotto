/** 저장 결과 피드백 타이머 */

import { useCallback, useEffect, useRef } from 'react';

import { SAVE_STATUS_RESET_DELAY_MS } from '../constants/home';
import type { SaveStatus } from '../types/home';

export const useSaveTimer = () => {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const scheduleReset = useCallback((setStatus: (s: SaveStatus) => void) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setStatus('idle'), SAVE_STATUS_RESET_DELAY_MS);
  }, []);

  return { scheduleReset };
};
