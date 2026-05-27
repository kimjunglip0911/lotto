import { useEffect, useState } from 'react';
import { loadDrawNumbers } from '../api';

export const useDraws = () => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const draws = await loadDrawNumbers({ signal: controller.signal });
        if (!isMounted) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (controller.signal.aborted || !isMounted) return;
        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setIsLoadingDraws(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { availableDraws, selectedDraw, setSelectedDraw, isLoadingDraws, drawLoadError };
};
