import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** loadSavedRecommendDraw 완료 후 훅에 반영할 값 */

export type SavedDrawLoadResult = {
  winningNumbers: number[] | null;
  adopted: number[];
  orderedSets: GeneratedSet[];
  summaryLines: string[];
  statusMessage: string;
};
