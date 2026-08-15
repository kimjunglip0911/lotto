import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { NUMBER_RANGE_MAX } from '@/lib/accu-nums/constants';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import type { CombinationGenerationResult } from '@/app/recommend/logic/combo/genTypes';
import { MAX_BAND_LADDER_DEPTH } from '@/app/recommend/constants/comboThresholds';
import {
  formatStatsBandSummary,
  STATS_BAND_CASCADE_LABEL,
  STATS_POSITION_BAND_WINDOW,
} from '@/lib/statsWindow';

export const flattenBandWindows = (
  histories: readonly (readonly WinningNumberRow[])[],
) =>
  histories.map((hist) => {
    const sorted = [...hist].sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains);
    return buildPositionBandDistribution(sorted).rows;
  });

export const uniquePool = (numberPool: readonly number[]) =>
  [...new Set(numberPool)].filter((n) => n >= 1 && n <= NUMBER_RANGE_MAX).sort((a, b) => a - b);

export const lastHist = (histories: readonly (readonly WinningNumberRow[])[]) =>
  histories[histories.length - 1] ?? histories[0] ?? [];

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
  `자리대 순위: ${formatStatsBandSummary(STATS_BAND_CASCADE_LABEL, STATS_POSITION_BAND_WINDOW, sampleDraws)}·RANK N=N등 band 시작→ladder(최대 ${MAX_BAND_LADDER_DEPTH}단·출현 band만)`;
