import { generateAndSaveSets } from '@/app/recommend/api/recommend/generateSave';
import { APPLIED_RULE_IDS } from '@/app/recommend/constants/generationRules';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { buildExcludedNumbers } from '@/app/recommend/helpers/genExcluded';
import { buildPayloadSets } from '@/app/recommend/helpers/genPayload';
import {
  buildSuccessStatusMessage,
  mergeSummaryLines,
} from '@/app/recommend/helpers/genMessages';
import { fetchGenerationInputs } from '@/app/recommend/logic/generation/fetchInputs';
import { assertSetsNonEmpty } from '@/app/recommend/logic/generation/validateGenSets';
import {
  generateCombinationBasedSets,
  orderSetsByProfileSlots,
} from '@/app/recommend/logic/combo';
import type {
  GenerationPhaseHandlers,
  GenerationPipelineResult,
} from '@/app/recommend/types/generationHook';

/** 20세트 생성·저장 파이프라인(React 상태 없음) */

export const runRecommendGeneration = async (
  apiUrl: string,
  selectedDraw: number,
  phases?: GenerationPhaseHandlers,
): Promise<GenerationPipelineResult> => {
  const { adopted, reservePools, fullHistory, infoMessage } = await fetchGenerationInputs(
    apiUrl,
    selectedDraw,
  );
  phases?.onAdoptedLoaded?.(adopted);

  const { sets, summaryLines, warning } = await generateCombinationBasedSets(
    fullHistory,
    adopted,
    selectedDraw,
    reservePools,
  );
  assertSetsNonEmpty(sets, summaryLines);

  const mergedSummary = mergeSummaryLines(infoMessage, summaryLines);
  phases?.onSummaryReady?.(mergedSummary);

  const excludedNumbers = buildExcludedNumbers(adopted);
  const ruleIds = [...APPLIED_RULE_IDS];
  const payloadSets = buildPayloadSets(sets, excludedNumbers, ruleIds);

  phases?.onSaving?.();
  const generatedData = await generateAndSaveSets(apiUrl, {
    drawNo: selectedDraw,
    appliedRuleIds: ruleIds,
    excludedNumbers,
    sets: payloadSets,
  });

  const orderedSets = orderSetsByProfileSlots(generatedData);
  const statusMessage = buildSuccessStatusMessage({
    drawNo: selectedDraw,
    count: generatedData.length,
    targetCount: TARGET_SET_COUNT,
    infoMessage,
    warning,
  });

  return { orderedSets, adopted, summaryLines: mergedSummary, statusMessage };
};
