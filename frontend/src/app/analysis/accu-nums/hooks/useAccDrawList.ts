/** 첫 화면에서 조회 가능한 회차 목록만 불러와 선택값을 채운다. */

import { useEffect, useState } from 'react';

import { fetchDrawNumbers } from '../api';

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

      try {
        const draws = await fetchDrawNumbers({ signal: abortController.signal });
        if (!isMounted) {
          return;
        }

        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) {
          return;
        }

        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setIsLoadingDraws(false);
        }
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
