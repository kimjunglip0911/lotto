import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

export type CombinationGenerationOptions = {
  repairYieldEvery?: number;
  pastWinningKeys?: ReadonlySet<string>;
  appearHist?: readonly WinningNumberRow[];
};
