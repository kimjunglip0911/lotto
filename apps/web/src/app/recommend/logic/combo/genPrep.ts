import { NUMBER_RANGE_MAX } from '@/lib/accu-nums/constants';
import type { CombinationGenerationResult } from '@/app/recommend/logic/combo/genTypes';
import {
  formatStatsBandSummary,
  STATS_BAND_CASCADE_LABEL,
  STATS_POSITION_BAND_WINDOW,
} from '@/lib/statsWindow';

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
  `자리대 순위: ${formatStatsBandSummary(STATS_BAND_CASCADE_LABEL, STATS_POSITION_BAND_WINDOW, sampleDraws)}·RANK N=N등(1%↑, 미만은 자리별 1등부터 순환)`;
