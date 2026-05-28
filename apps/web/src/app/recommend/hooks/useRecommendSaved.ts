'use client';

import { useEffect } from 'react';
import {
  applySavedLoadError,
  applySavedLoadResult,
  resetSavedBeforeLoad,
} from '@/app/recommend/helpers/savedState';
import { loadSavedRecommendDraw } from '@/app/recommend/logic/saved/loadSavedDraw';
import type { SavedHookOpts } from '@/app/recommend/types/savedHook';

/** 선택 회차의 저장 세트·채택 번호 로드 */

export const useRecommendSaved = (
  apiUrl: string,
  selectedDraw: number | null,
  isLoadingDraws: boolean,
  opts: SavedHookOpts,
) => {
  useEffect(() => {
    if (!selectedDraw || isLoadingDraws) return;
    let isMounted = true;

    const run = async () => {
      resetSavedBeforeLoad(opts, selectedDraw);
      try {
        const result = await loadSavedRecommendDraw(apiUrl, selectedDraw);
        if (!isMounted) return;
        applySavedLoadResult(opts, result);
      } catch (err) {
        if (!isMounted) return;
        applySavedLoadError(opts, selectedDraw, err);
      }
    };

    void run();
    return () => {
      isMounted = false;
    };
  }, [apiUrl, isLoadingDraws, selectedDraw, opts]);
};
