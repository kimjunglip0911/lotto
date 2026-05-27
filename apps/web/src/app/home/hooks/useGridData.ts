/** 회차 목록·세트·당첨번호를 API에서 불러온다 */

import { useEffect, useState } from 'react';

import { fetchDrawBundle } from '../helpers/fetchBundle';
import { fetchInitialDraws } from '../helpers/fetchDraws';
import type { LotterySetData, WinningNumbersByDraw } from '../types/home';

interface UseGridDataOptions {
  onDrawChange?: () => void;
}

export const useGridData = (options?: UseGridDataOptions) => {
  const onDrawChange = options?.onDrawChange;
  const [sets, setSets] = useState<LotterySetData[]>([]);
  const [winningByDraw, setWinningByDraw] = useState<WinningNumbersByDraw | null>(null);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchInitialDraws()
      .then((draws) => {
        if (cancelled || draws.length === 0) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => prev ?? draws[0]);
      })
      .catch((error) => console.error('Error fetching draw numbers:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedDraw === null) return;
    onDrawChange?.();
    let cancelled = false;
    void fetchDrawBundle(selectedDraw)
      .then(({ sets: nextSets, winning }) => {
        if (cancelled) return;
        setSets(nextSets);
        setWinningByDraw(winning);
      })
      .catch((error) => {
        console.error('Error loading draw data:', error);
        if (!cancelled) setWinningByDraw(null);
      });
    return () => {
      cancelled = true;
    };
  }, [onDrawChange, selectedDraw]);

  return { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw };
};
