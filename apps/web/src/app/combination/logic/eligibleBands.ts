import type { PositionBandDistributionRow } from '../types';
import { bandIndexFromLabel, sortRowsForPosition } from './rankPositionBands';

/** 추천 채택 하한(%). 1.00은 포함, 0.x는 제외. */
export const MIN_BAND_PCT = 1;

export const eligibleSorted = (
  rows: readonly PositionBandDistributionRow[],
  pos: number,
): PositionBandDistributionRow[] =>
  sortRowsForPosition(
    rows.filter((r) => r.position === pos && r.percentage >= MIN_BAND_PCT),
  );

/** RANK N ladder: (N-1)%K부터 채택 가능 번호대를 한 바퀴. */
export const wrapEligibleLadder = (
  eligible: readonly PositionBandDistributionRow[],
  rank: number,
): number[] => {
  const k = eligible.length;
  if (k === 0 || rank < 1) return [];
  const start = (rank - 1) % k;
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    out.push(bandIndexFromLabel(eligible[(start + i) % k]!.bandLabel));
  }
  return out;
};
