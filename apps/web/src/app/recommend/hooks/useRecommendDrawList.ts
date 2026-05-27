'use client';

import { useEffect, useState } from 'react';
import { fetchDrawNumbers } from '@/app/recommend/api/draw/drawNums';

/** 회차 목록·선택 상태 */

export const useRecommendDrawList = (apiUrl: string) => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const draws = await fetchDrawNumbers(apiUrl);
        if (!isMounted) return;
        const nextDraw = draws.length > 0 ? draws[0]! + 1 : 1;
        setAvailableDraws([nextDraw, ...draws]);
        setSelectedDraw(nextDraw);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching draw numbers:', err);
        setAvailableDraws([]);
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setIsLoadingDraws(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  return {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
  };
};
