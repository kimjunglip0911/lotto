import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** useRecommendGeneration 훅에 넘기는 UI 상태 setter 묶음 */

export type GenOpts = {
  selectedDraw: number | null;
  setGeneratedSets: (value: GeneratedSet[]) => void;
  setAdoptedNumbers: (value: number[]) => void;
  setCombinationSummaryLines: (value: string[]) => void;
  setStatusMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};

/** 생성 파이프라인 완료 후 훅에 반영할 값 */

export type GenerationPipelineResult = {
  orderedSets: GeneratedSet[];
  adopted: number[];
  summaryLines: string[];
  statusMessage: string;
};

/** 파이프라인 중간 단계마다 훅이 UI를 갱신할 때 쓰는 콜백 */

export type GenerationPhaseHandlers = {
  onAdoptedLoaded?: (adopted: number[]) => void;
  onSummaryReady?: (summaryLines: string[]) => void;
  onSaving?: () => void;
};
