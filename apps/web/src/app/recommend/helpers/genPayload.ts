import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** 저장 API에 넣을 세트 배열에 규칙 ID·빈 제외 목록을 붙인다 */

export const buildPayloadSets = (
  sets: readonly GeneratedSet[],
  ruleIds: readonly string[],
): Array<GeneratedSet & { applied_rule_ids: string[]; excluded_numbers: number[] }> =>
  sets.map((set) => ({
    ...set,
    applied_rule_ids: [...ruleIds],
    excluded_numbers: [],
  }));
