import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import type { PositionBandDistributionRow } from '@/app/combination/types';
import type { ComboWinKey } from '@/app/combination/types/window';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { pickStatsHistory } from '@/lib/pickStatsHistory';
import { WIN_SIZES } from '@/app/recommend/logic/combo/slotWin';

export type WinFlats = Record<ComboWinKey, readonly PositionBandDistributionRow[]>;

const KEYS: readonly ComboWinKey[] = ['1y', '3y', 'all'];

/** 기준 회차 직전 이력으로 1년·3년·전체 자리대 집계를 만든다. */
export const flatsFromHist = (
  hist: readonly WinningNumberRow[],
  refDraw: number,
): WinFlats => {
  const out = {} as Record<ComboWinKey, PositionBandDistributionRow[]>;
  for (const key of KEYS) {
    const sliced = pickStatsHistory(hist, refDraw, WIN_SIZES[key]);
    out[key] = buildPositionBandDistribution(sliced).rows;
  }
  return out;
};

/** 이력이 있으면 기간별로 자르고, 없으면 저장본을 세 기간에 같이 쓴다. */
export const flatsOrStored = (
  stored: readonly PositionBandDistributionRow[],
  hist: readonly WinningNumberRow[] | undefined,
  refDraw: number,
): WinFlats => (hist && hist.length > 0 ? flatsFromHist(hist, refDraw) : {
  '1y': stored,
  '3y': stored,
  all: stored,
});
