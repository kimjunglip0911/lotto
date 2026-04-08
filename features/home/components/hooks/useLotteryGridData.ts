import { useCallback, useEffect, useState } from 'react';

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

interface UseLotteryGridDataOptions {
  onDrawChange?: () => void;
}

export const useLotteryGridData = (options?: UseLotteryGridDataOptions) => {
  const onDrawChange = options?.onDrawChange;
  const [sets, setSets] = useState<LotterySet[]>([]);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | string>('');

  const fetchAvailableDraws = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/drawings/draw-numbers`);
      if (response.ok) {
        const data = await response.json();
        setAvailableDraws(data);
        if (data.length > 0 && !selectedDraw) {
          setSelectedDraw(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching draw numbers:', error);
    }
  }, [selectedDraw]);

  useEffect(() => {
    fetchAvailableDraws();
  }, [fetchAvailableDraws]);

  useEffect(() => {
    if (!selectedDraw) return;

    let isMounted = true;

    const loadData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const setsResponse = await fetch(`${apiUrl}/api/drawings/by-no?draw_no=${selectedDraw}`);

        if (!isMounted) return;

        onDrawChange?.();

        if (setsResponse.ok) {
          const setsData = await setsResponse.json();
          setSets(setsData);
        } else {
          setSets([]);
        }
      } catch (error) {
        console.error('Error loading draw data:', error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [onDrawChange, selectedDraw]);

  return {
    sets,
    availableDraws,
    selectedDraw,
    setSelectedDraw,
  };
};
