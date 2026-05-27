import { recommendApiUrl } from '@/app/recommend/api/core/url';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { isGeneratedSet } from '@/app/recommend/helpers/validators';

/** 생성한 추천 세트를 서버에 저장한다 */

export const generateAndSaveSets = async (
  apiUrl: string,
  payload: {
    drawNo: number;
    appliedRuleIds: string[];
    excludedNumbers: number[];
    sets: Array<GeneratedSet & { applied_rule_ids: string[]; excluded_numbers: number[] }>;
  },
): Promise<GeneratedSet[]> => {
  const response = await fetch(recommendApiUrl('/api/recommend/generate-and-save', apiUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draw_no: payload.drawNo,
      applied_rule_ids: payload.appliedRuleIds,
      excluded_numbers: payload.excludedNumbers,
      sets: payload.sets,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate and save sets: ${response.status}`);
  }

  const generatedData: unknown = await response.json();
  if (!Array.isArray(generatedData) || !generatedData.every(isGeneratedSet)) {
    throw new Error('Generate and save response is invalid');
  }
  return generatedData;
};
