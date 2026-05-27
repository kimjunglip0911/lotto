import { useEffect, useState } from 'react';
import { fetchFinalPickDrawList } from '../api/draw/drawList';

/** 통합 분석 — 조회 가능 회차 목록. */
export const useFinalPickDrawList = () => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      const { draws, error } = await fetchFinalPickDrawList(abortController.signal);
      if (!isMounted || abortController.signal.aborted) return;
      if (error) {
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError(error);
      } else {
        setAvailableDraws(draws);
        setSelectedDraw((prev) => {
          if (!prev) return draws.length > 0 ? String(draws[0]) : '';
          const prevDraw = Number(prev);
          return Number.isInteger(prevDraw) && draws.includes(prevDraw) ? prev : String(draws[0]);
        });
      }
      setIsLoadingDraws(false);
    };

    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return { availableDraws, selectedDraw, setSelectedDraw, isLoadingDraws, drawLoadError };
};
