import { useEffect, useState } from 'react';
import { fetchJson, runStreakUrl } from '../logic/api';

// 페이지에 접속하면 회차 목록을 한 번 불러와 셀렉트 박스를 채워 줍니다.
// 실패하면 "회차 정보를 불러오지 못했습니다." 안내를 화면에 보여 줍니다.

type UseDrawListResult = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
};

export const useDrawList = (): UseDrawListResult => {
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
        const data = await fetchJson<unknown>(runStreakUrl('draw-numbers'), {
          signal: controller.signal,
        });
        if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
        const draws = data.filter((item): item is number => typeof item === 'number');
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
