import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import {
  STATS_WINDOW_ALL,
  STATS_WINDOW_ALL_LABEL,
  STATS_WINDOW_ONE_YEAR,
  STATS_WINDOW_ONE_YEAR_LABEL,
  STATS_WINDOW_THREE_YEAR,
  STATS_WINDOW_THREE_YEAR_LABEL,
} from '@/lib/statsWindow';
import type { ComboWinView } from '../types/window';
import { buildPositionBandDistribution } from './buildPositionBandDistribution';

const SPECS = [
  { key: '1y', label: STATS_WINDOW_ONE_YEAR_LABEL, size: STATS_WINDOW_ONE_YEAR },
  { key: '3y', label: STATS_WINDOW_THREE_YEAR_LABEL, size: STATS_WINDOW_THREE_YEAR },
  { key: 'all', label: STATS_WINDOW_ALL_LABEL, size: STATS_WINDOW_ALL },
] as const;

/** 당첨 이력을 1년·3년·전체 구간 집계로 바꾼다. */
export const toWindows = (winners: readonly WinningNumberRow[]): ComboWinView[] =>
  SPECS.map((spec) => {
    const sliced = sliceLatestStatsHistory(winners, spec.size);
    const dist = buildPositionBandDistribution(sliced);
    const finite = Number.isFinite(spec.size);
    return {
      key: spec.key,
      label: spec.label,
      windowSize: finite ? spec.size : null,
      totalDraws: dist.totalDraws,
      rows: dist.rows,
    };
  });
