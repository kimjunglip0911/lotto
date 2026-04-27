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

type SelectedDraw = number | null;

export const useLotteryGridData = (options?: UseLotteryGridDataOptions) => {
  const onDrawChange = options?.onDrawChange;
  const [sets, setSets] = useState<LotterySet[]>([]);
  const [winningByDraw, setWinningByDraw] = useState<WinningNumbersByDraw | null>(null);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<SelectedDraw>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDrawNumbers = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/draw-numbers`);
        if (!response.ok || cancelled) return;

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0 || cancelled) return;

        const nextDraw = data[0] + 1;
        const draws = [nextDraw, ...data];
        setAvailableDraws(draws);
        setSelectedDraw((prev) => prev ?? draws[0]);
      } catch (error) {
        console.error('Error fetching draw numbers:', error);
      }
    };

    void loadDrawNumbers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedDraw === null) return;
    onDrawChange?.();

    const loadData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const [setsResponse, winningResponse] = await Promise.all([
          fetch(`${apiUrl}/api/recommend/drawings?draw_no=${selectedDraw}`),
          fetch(`${apiUrl}/api/drawings/winning-by-no?draw_no=${selectedDraw}`),
        ]);

        if (setsResponse.ok) {
          const setsData = await setsResponse.json();
          setSets(Array.isArray(setsData) ? setsData : []);
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
        setWinningByDraw(null);
      }
    };

    void loadData();
  }, [onDrawChange, selectedDraw]);

  return {
    sets,
    winningByDraw,
    availableDraws,
    selectedDraw,
    setSelectedDraw,
  };
};

