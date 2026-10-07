import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import type { ComboWinKey } from '@/app/combination/types/window';
import {
  buildPositionRankLookup,
  type PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import { WIN_SIZES } from '@/app/recommend/logic/combo/slotWin';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';

export type WinLookups = Record<ComboWinKey, PositionRankLookup>;

const oneLookup = (rows: readonly WinningNumberRow[], size: number): PositionRankLookup => {
  const sliced = sliceLatestStatsHistory(rows, size).map(withSortedMains);
  const { rows: flat } = buildPositionBandDistribution(sliced);
  return buildPositionRankLookup(rankPositionBandRows(flat));
};

/** 이미 기준 회차 이전인 이력으로 1년·3년·전체 순위표 */
export const lookupsFromHist = (rows: readonly WinningNumberRow[]): WinLookups => ({
  '1y': oneLookup(rows, WIN_SIZES['1y']),
  '3y': oneLookup(rows, WIN_SIZES['3y']),
  all: oneLookup(rows, WIN_SIZES.all),
});
