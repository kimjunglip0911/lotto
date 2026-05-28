'use client';

import { useState } from 'react';
import { errorMessage } from '@/app/recommend/api/core/fetchCore';
import { useApiUrl } from '@/app/recommend/hooks/useApiUrl';
import {
  GEN_STATUS_LOADING,
  GEN_STATUS_SAVING,
  genStatusGenerating,
} from '@/app/recommend/helpers/genMessages';
import { runRecommendGeneration } from '@/app/recommend/logic/generation/runPipeline';
import type { GenOpts } from '@/app/recommend/types/generationHook';

/** 조합 20세트 생성·저장 */

export const useRecommendGeneration = ({
  selectedDraw,
  setGeneratedSets,
  setAdoptedNumbers,
  setCombinationSummaryLines,
  setStatusMessage,
  setError,
}: GenOpts) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const apiUrl = useApiUrl();

  const handleGenerateAndSave = async () => {
    if (!selectedDraw) return;
    setIsGenerating(true);
    setError(null);
    setStatusMessage(GEN_STATUS_LOADING);

    try {
      const result = await runRecommendGeneration(apiUrl, selectedDraw, {
        onAdoptedLoaded: (adopted) => {
          setAdoptedNumbers(adopted);
          setStatusMessage(genStatusGenerating());
        },
        onSummaryReady: setCombinationSummaryLines,
        onSaving: () => setStatusMessage(GEN_STATUS_SAVING),
      });

      setGeneratedSets(result.orderedSets);
      setStatusMessage(result.statusMessage);
    } catch (err: unknown) {
      setError(errorMessage(err));
      setGeneratedSets([]);
      setAdoptedNumbers([]);
      setCombinationSummaryLines([]);
      setStatusMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, handleGenerateAndSave };
};
