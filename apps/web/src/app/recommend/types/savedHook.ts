import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** useRecommendSaved 훅에 넘기는 UI 상태 setter 묶음 */

export type SavedHookOpts = {
  setGeneratedSets: (value: GeneratedSet[]) => void;
  setWinningNumbers: (value: number[] | null) => void;
  setCombinationSummaryLines: (value: string[]) => void;
  setStatusMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};
