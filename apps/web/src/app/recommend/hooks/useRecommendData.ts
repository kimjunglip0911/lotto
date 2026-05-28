'use client';

import { useMemo, useState } from 'react';
import { useApiUrl } from '@/app/recommend/hooks/useApiUrl';
import { useRecommendDrawList } from '@/app/recommend/hooks/useRecommendDrawList';
import { initialStatusMessage } from '@/app/recommend/helpers/savedMessages';
import { useRecommendSaved } from '@/app/recommend/hooks/useRecommendSaved';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** 추천 페이지 데이터 — 회차·저장 세트·채택 조립 */

export const useRecommendData = () => {
  const apiUrl = useApiUrl();
  const draws = useRecommendDrawList(apiUrl);

  const [statusMessage, setStatusMessage] = useState<string | null>(initialStatusMessage());
  const [error, setError] = useState<string | null>(null);
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null);
  const [adoptedNumbers, setAdoptedNumbers] = useState<number[]>([]);
  const [combinationSummaryLines, setCombinationSummaryLines] = useState<string[]>([]);

  const savedOpts = useMemo(
    () => ({
      setStatusMessage,
      setError,
      setGeneratedSets,
      setWinningNumbers,
      setAdoptedNumbers,
      setCombinationSummaryLines,
    }),
    [
      setStatusMessage,
      setError,
      setGeneratedSets,
      setWinningNumbers,
      setAdoptedNumbers,
      setCombinationSummaryLines,
    ],
  );

  useRecommendSaved(apiUrl, draws.selectedDraw, draws.isLoadingDraws, savedOpts);

  return {
    ...draws,
    statusMessage,
    setStatusMessage,
    error,
    setError,
    generatedSets,
    setGeneratedSets,
    winningNumbers,
    adoptedNumbers,
    setAdoptedNumbers,
    combinationSummaryLines,
    setCombinationSummaryLines,
  };
};
