'use client';

import { useState } from 'react';
import { fetchChiSquareFullHistory } from '@/app/recommend/api/chi/chiHistory';
import { errorMessage } from '@/app/recommend/api/core/fetchCore';
import { generateAndSaveSets } from '@/app/recommend/api/recommend/generateSave';
import { useApiUrl } from '@/app/recommend/hooks/useApiUrl';
import { fetchFinalPickAdopted } from '@/app/recommend/logic/adopt/computeAdopted';
import {
  generateCombinationBasedSets,
  orderSetsByProfileSlots,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combo';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

const APPLIED_RULE_IDS = ['final-pick-adopted', 'combination-20sets'] as const;

type GenOpts = {
  selectedDraw: number | null;
  setGeneratedSets: (value: GeneratedSet[]) => void;
  setAdoptedNumbers: (value: number[]) => void;
  setCombinationSummaryLines: (value: string[]) => void;
  setStatusMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};

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
    setStatusMessage('통합 채택 번호와 조합 통계를 불러오는 중입니다...');

    try {
      const [adoptedResult, fullHistory] = await Promise.all([
        fetchFinalPickAdopted(apiUrl, selectedDraw),
        fetchChiSquareFullHistory(apiUrl),
      ]);

      if (adoptedResult.error) throw new Error(adoptedResult.error);

      const adopted = adoptedResult.adopted;
      setAdoptedNumbers(adopted);
      if (adopted.length < 6) {
        throw new Error('통합 채택 번호가 6개 미만입니다. 당첨번호가 등록된 회차인지 확인해 주세요.');
      }

      setStatusMessage(`조합 제약을 적용해 ${TARGET_SET_COUNT}세트를 생성하는 중입니다...`);
      const { sets, summaryLines, warning } = await generateCombinationBasedSets(
        fullHistory,
        adopted,
        selectedDraw,
      );
      setCombinationSummaryLines([
        ...(adoptedResult.infoMessage ? [adoptedResult.infoMessage] : []),
        ...summaryLines,
      ]);

      if (sets.length === 0) {
        throw new Error(summaryLines.join(' ') || '세트를 생성하지 못했습니다.');
      }

      const excludedNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
        (n) => !adopted.includes(n),
      );
      const payloadSets = sets.map((set) => ({
        ...set,
        applied_rule_ids: [...APPLIED_RULE_IDS],
        excluded_numbers: excludedNumbers,
      }));

      setStatusMessage('서버에 저장하는 중입니다...');
      const generatedData = await generateAndSaveSets(apiUrl, {
        drawNo: selectedDraw,
        appliedRuleIds: [...APPLIED_RULE_IDS],
        excludedNumbers,
        sets: payloadSets,
      });

      setGeneratedSets(orderSetsByProfileSlots(generatedData));
      const refNote = adoptedResult.infoMessage ? ` ${adoptedResult.infoMessage}` : '';
      const shortOfGoal =
        generatedData.length < TARGET_SET_COUNT
          ? ` 목표 ${TARGET_SET_COUNT}세트에 ${TARGET_SET_COUNT - generatedData.length}개 부족합니다.`
          : '';
      const tail = warning ? ` ${warning}` : '';
      setStatusMessage(
        `${selectedDraw}회차 기준으로 ${generatedData.length}개 세트를 생성·저장했습니다.${shortOfGoal}${refNote}${tail}`,
      );
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
