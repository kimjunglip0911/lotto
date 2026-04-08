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

    // #region agent log
    fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'66d4be'},body:JSON.stringify({sessionId:'66d4be',runId:'pre-fix',hypothesisId:'H3',location:'features/home/components/hooks/useLotteryGridData.ts:50',message:'selectedDraw effect fired',data:{selectedDraw},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'66d4be'},body:JSON.stringify({sessionId:'66d4be',runId:'pre-fix',hypothesisId:'H3',location:'features/home/components/hooks/useLotteryGridData.ts:85',message:'winning numbers fetch success',data:{drawNo:winningData?.draw_no ?? null,hasNums:Boolean(winningData?.num1)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        } else {
          setWinningByDraw(null);
          // #region agent log
          fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'66d4be'},body:JSON.stringify({sessionId:'66d4be',runId:'pre-fix',hypothesisId:'H3',location:'features/home/components/hooks/useLotteryGridData.ts:89',message:'winning numbers fetch failed',data:{status:winningResponse.status},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
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
