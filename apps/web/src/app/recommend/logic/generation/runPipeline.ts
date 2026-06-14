import { generateAndSaveSets } from '@/app/recommend/api/recommend/generateSave';
import { APPLIED_RULE_IDS } from '@/app/recommend/constants/generationRules';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { buildPayloadSets } from '@/app/recommend/helpers/genPayload';
import {
  buildSuccessStatusMessage,
  mergeSummaryLines,
} from '@/app/recommend/helpers/genMessages';
import { fetchGenerationInputs } from '@/app/recommend/logic/generation/fetchInputs';
import { pickStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_BAND_CASCADE_WINDOWS, STATS_WINDOW_ONE_YEAR } from '@/lib/statsWindow';
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
  const { fullHistory } = await fetchGenerationInputs(apiUrl);
  const sumHistory = pickStatsHistory(fullHistory, selectedDraw, STATS_WINDOW_ONE_YEAR);
  const bandWindowHistories = STATS_BAND_CASCADE_WINDOWS.map((size) =>
    pickStatsHistory(fullHistory, selectedDraw, size),
  );

  const { sets, summaryLines, warning } = await generateCombinationBasedSets(
    sumHistory,
    bandWindowHistories,
    FULL_LOTTO_POOL,
    selectedDraw,
  );
  assertSetsNonEmpty(sets, summaryLines);

  const mergedSummary = mergeSummaryLines(null, summaryLines);
  phases?.onSummaryReady?.(mergedSummary);

  const ruleIds = [...APPLIED_RULE_IDS];
  const payloadSets = buildPayloadSets(sets, ruleIds);

  phases?.onSaving?.();
  const generatedData = await generateAndSaveSets(apiUrl, {
    drawNo: selectedDraw,
    appliedRuleIds: ruleIds,
    excludedNumbers: [],
    sets: payloadSets,
  });

  const orderedSets = orderSetsByProfileSlots(generatedData);
  const statusMessage = buildSuccessStatusMessage({
    drawNo: selectedDraw,
    count: generatedData.length,
    targetCount: TARGET_SET_COUNT,
    infoMessage: null,
    warning,
  });

  return { orderedSets, summaryLines: mergedSummary, statusMessage };
};
