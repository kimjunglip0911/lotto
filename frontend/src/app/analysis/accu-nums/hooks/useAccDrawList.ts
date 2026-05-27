/** 첫 화면에서 조회 가능한 회차 목록만 불러와 선택값을 채운다. */

import { useEffect, useState } from 'react';

import { loadAccDrawNumbers } from '../logic/loadDrawList';

export const useAccDrawList = () => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      const { draws, error } = await loadAccDrawNumbers(abortController.signal);
      if (!isMounted || abortController.signal.aborted) {
        return;
      }

      if (error) {
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError(error);
      } else {
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      }

      if (isMounted) {
        setIsLoadingDraws(false);
      }
    };

    void loadDrawNumbers();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return { availableDraws, selectedDraw, setSelectedDraw, isLoadingDraws, drawLoadError };
};
