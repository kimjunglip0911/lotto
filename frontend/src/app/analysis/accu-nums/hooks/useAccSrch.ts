/** 조회 버튼·세션·누적 집계 상태를 묶고, API 결과를 한 번에 반영한다. */

import { useCallback, useReducer, useRef } from 'react';

import { accSrchRed } from '../logic/accSrchRed';
import { mkAccSrchInit } from '../logic/accSrchStDef';
import { execAccSearch } from '../logic/execAccSrch';
import { parseSelDraw } from '../logic/parseSelDraw';

type Opts = { selectedDraw: string };

export const useAccSrch = ({ selectedDraw }: Opts) => {
  const [st, dispatch] = useReducer(accSrchRed, undefined, mkAccSrchInit);
  const searchSessionRef = useRef(0);

  const resetSearchResults = useCallback((options?: { clearWinningNumber?: boolean }) => {
    dispatch({ type: 'resetDerived', clearWin: options?.clearWinningNumber });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedDraw) {
      return;
    }

    const selectedDrawNo = parseSelDraw(selectedDraw);
    if (selectedDrawNo === null) {
      dispatch({ type: 'invalidSel' });
      return;
    }

    const session = ++searchSessionRef.current;
    dispatch({ type: 'start', draw: selectedDraw });

    try {
      const out = await execAccSearch(selectedDrawNo, session, searchSessionRef);
      if (out) {
        dispatch({ type: 'apply', out });
      }
    } catch (error) {
      console.error('Error fetching accumulated numbers search data:', error);
      if (session === searchSessionRef.current) {
        dispatch({ type: 'fail' });
      }
    } finally {
      if (session === searchSessionRef.current) {
        dispatch({ type: 'end' });
      }
    }
  }, [selectedDraw]);

  return { ...st, handleSearch, resetSearchResults };
};
