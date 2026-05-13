import { useEffect, useState } from 'react';
import { loadDrawNumbers } from '../logic/streakFetch';

// 처음 들어올 때 한 번만 서버에서 회차 목록을 받아 셀렉트 박스를 채웁니다.
// 실패하면 “회차 정보를 불러오지 못했습니다.” 안내가 뜨도록 합니다.

type UseDrawsResult = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
};

export const useDraws = (): UseDrawsResult => {
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
    };
  }, []);

  return { availableDraws, selectedDraw, setSelectedDraw, isLoadingDraws, drawLoadError };
};
