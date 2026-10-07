import { NUMBER_RANGE_MAX } from '@/lib/accu-nums/constants';
import type { CombinationGenerationResult } from '@/app/recommend/logic/combo/genTypes';

export const uniquePool = (numberPool: readonly number[]) =>
  [...new Set(numberPool)].filter((n) => n >= 1 && n <= NUMBER_RANGE_MAX).sort((a, b) => a - b);

export const emptyResult = (
  summaryLines: string[],
  extra: string,
  warning: string,
): CombinationGenerationResult => ({
  sets: [],
  summaryLines: [...summaryLines, extra],
  warning,
});

export const bandRankSummary = (sampleDraws: number): string =>
  `자리대: 1~10세트 1년·11~20세트 3년·21~30세트 전체(${sampleDraws}회)·각 1~10등(1%↑, 10등 다음은 1등)`;
