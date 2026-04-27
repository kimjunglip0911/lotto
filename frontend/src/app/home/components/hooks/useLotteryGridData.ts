import { useEffect, useState } from 'react';
import type { LotterySetData, WinningNumbersByDraw } from '@/app/home/components/types';

interface UseLotteryGridDataOptions {
  onDrawChange?: () => void;
}

type SelectedDraw = number | null;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const toAvailableDraws = (data: unknown): number[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const drawNumbers = data.filter((value): value is number => Number.isInteger(value));
  if (drawNumbers.length === 0) return [];
  return [drawNumbers[0] + 1, ...drawNumbers];
};

const toLotterySets = (data: unknown): LotterySetData[] => {
  return Array.isArray(data) ? (data as LotterySetData[]) : [];
};

export const useLotteryGridData = (options?: UseLotteryGridDataOptions) => {
  const onDrawChange = options?.onDrawChange;
  const [sets, setSets] = useState<LotterySetData[]>([]);
  const [winningByDraw, setWinningByDraw] = useState<WinningNumbersByDraw | null>(null);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<SelectedDraw>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDrawNumbers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/analysis/accumulated-numbers/draw-numbers`);
        if (!response.ok || cancelled) return;

        const data = await response.json();
        if (cancelled) return;

        const draws = toAvailableDraws(data);
        if (draws.length === 0) return;
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
        const [setsResponse, winningResponse] = await Promise.all([
          fetch(`${API_BASE}/api/recommend/drawings?draw_no=${selectedDraw}`),
          fetch(`${API_BASE}/api/drawings/winning-by-no?draw_no=${selectedDraw}`),
        ]);

        if (setsResponse.ok) {
          const setsData = await setsResponse.json();
          setSets(toLotterySets(setsData));
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

