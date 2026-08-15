import { generateAndSaveSets } from '@/app/recommend/api/recommend/generateSave';
import { APPLIED_RULE_IDS } from '@/app/recommend/constants/generationRules';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { buildPayloadSets } from '@/app/recommend/helpers/genPayload';
import { formatExcludeSummary } from '@/app/recommend/helpers/excludeSummary';
import { buildSuccessStatusMessage } from '@/app/recommend/helpers/genMessages';
import { fetchGenerationInputs } from '@/app/recommend/logic/generation/fetchInputs';
import { buildGenArgs } from '@/app/recommend/logic/generation/buildGenArgs';
import { assertSetsNonEmpty } from '@/app/recommend/logic/generation/validateGenSets';
import {
  generateCombinationBasedSets,
  orderSetsByProfileSlots,
} from '@/app/recommend/logic/combo';
import type {
  GenerationPhaseHandlers,
  GenerationPipelineResult,
} from '@/app/recommend/types/generationHook';

/** 30세트 생성·저장 파이프라인(React 상태 없음) */

export const runRecommendGeneration = async (
  apiUrl: string,
  selectedDraw: number,
  phases?: GenerationPhaseHandlers,
): Promise<GenerationPipelineResult> => {
  const { fullHistory, comboRows } = await fetchGenerationInputs(apiUrl);
  const args = buildGenArgs(fullHistory, selectedDraw);

  const { sets, summaryLines, warning } = await generateCombinationBasedSets(
    comboRows,
    args.numberPool,
    selectedDraw,
    {
      pastWinningKeys: args.pastWinningKeys,
      appearHist: fullHistory,
    },
  );
  assertSetsNonEmpty(sets, summaryLines);

  const mergedSummary = [
    formatExcludeSummary(args.excludedNumbers),
    ...summaryLines,
  ];
  phases?.onSummaryReady?.(mergedSummary);

  const ruleIds = [...APPLIED_RULE_IDS];
  phases?.onSaving?.();
  const generatedData = await generateAndSaveSets(apiUrl, {
    drawNo: selectedDraw,
    appliedRuleIds: ruleIds,
    excludedNumbers: args.excludedNumbers,
    sets: buildPayloadSets(sets, ruleIds, args.excludedNumbers),
  });

  return {
    orderedSets: orderSetsByProfileSlots(generatedData),
    summaryLines: mergedSummary,
    statusMessage: buildSuccessStatusMessage({
      drawNo: selectedDraw,
      count: generatedData.length,
      targetCount: TARGET_SET_COUNT,
      infoMessage: null,
      warning,
    }),
  };
};
