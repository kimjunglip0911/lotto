import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

export type CombinationGenerationOptions = {
  repairYieldEvery?: number;
  pastWinningKeys?: ReadonlySet<string>;
};
