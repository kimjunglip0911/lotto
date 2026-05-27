import { useEffect, useState } from 'react';
import { loadChiDrawNumbers } from '../logic/loadDrawList';

export const useChiSquareDrawList = () => {
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
      const { draws, error } = await loadChiDrawNumbers(abortController.signal);
      if (!isMounted || abortController.signal.aborted) return;
      if (error) {
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError(error);
      } else {
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
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
