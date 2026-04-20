import { useEffect, useState } from 'react';

export interface LotterySet {
  id?: number;
  draw_no?: number;
  method?: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
}

export interface WinningNumbersByDraw {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
}

interface UseLotteryGridDataOptions {
  onDrawChange?: () => void;
}

export const useLotteryGridData = (options?: UseLotteryGridDataOptions) => {
  const onDrawChange = options?.onDrawChange;
  const [sets, setSets] = useState<LotterySet[]>([]);
  const [winningByDraw, setWinningByDraw] = useState<WinningNumbersByDraw | null>(null);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/drawings/draw-numbers`);
          if (!response.ok) return;

          const data = await response.json();
          setAvailableDraws(data);
          setSelectedDraw((prev) => (prev || data.length === 0 ? prev : data[0]));
        } catch (error) {
          console.error('Error fetching draw numbers:', error);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedDraw) return;

    let isMounted = true;

    const loadData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const setsResponse = await fetch(`${apiUrl}/api/drawings/by-no?draw_no=${selectedDraw}`);
        const winningResponse = await fetch(`${apiUrl}/api/drawings/winning-by-no?draw_no=${selectedDraw}`);

        if (!isMounted) return;

        onDrawChange?.();

        if (setsResponse.ok) {
          const setsData = await setsResponse.json();
          setSets(setsData);
        } else {
          setSets([]);
        }

        if (winningResponse.ok) {
          const winningData = await winningResponse.json();
          setWinningByDraw(winningData);
        } else {
          setWinningByDraw(null);
        }
      } catch (error) {
        console.error('Error loading draw data:', error);
        if (isMounted) setWinningByDraw(null);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [onDrawChange, selectedDraw]);

  return {
    sets,
    winningByDraw,
    availableDraws,
    selectedDraw,
    setSelectedDraw,
  };
};

