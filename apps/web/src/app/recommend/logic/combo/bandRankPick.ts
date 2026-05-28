import { NUMBER_BAND_LABELS } from '@/app/analysis/combination/constants/bandLabels';
import type { PositionBandDistributionRow } from '@/app/analysis/combination/types';
import { MIN_BAND_TIER_PERCENT } from '@/app/recommend/constants/comboThresholds';

/** 자리별 분포에서 N등 band 인덱스를 고르고, 비율이 낮으면 1등으로 대체한다 */

const bandIndexFromRow = (row: PositionBandDistributionRow): number => {
  const idx = NUMBER_BAND_LABELS.indexOf(row.bandLabel as (typeof NUMBER_BAND_LABELS)[number]);
  return idx >= 0 ? idx : 0;
};

const distinctBandRanksForPosition = (
  sorted: readonly PositionBandDistributionRow[],
): number[] => {
  const ranks: number[] = [];
  const seen = new Set<number>();
  for (const row of sorted) {
    const b = bandIndexFromRow(row);
    if (seen.has(b)) continue;
    seen.add(b);
    ranks.push(b);
  }
  return ranks;
};

export const pickBandIndexForPosition = (
  sorted: readonly PositionBandDistributionRow[],
  rankIdx: number,
): number | null => {
  const distinctRanks = distinctBandRanksForPosition(sorted);
  if (distinctRanks.length > rankIdx) return distinctRanks[rankIdx]!;
  if (sorted.length > rankIdx) return bandIndexFromRow(sorted[rankIdx]!);
  if (sorted.length > 0) return bandIndexFromRow(sorted[sorted.length - 1]!);
  return null;
};

export const effectiveBandRankIdx = (
  sorted: readonly PositionBandDistributionRow[],
  rankIdx: number,
): number => {
  if (sorted.length === 0) return 0;
  const tierPct =
    sorted.length > rankIdx
      ? sorted[rankIdx]!.percentage
      : sorted[sorted.length - 1]!.percentage;
  return tierPct < MIN_BAND_TIER_PERCENT ? 0 : rankIdx;
};

export const bandIndexFromDistributionRow = bandIndexFromRow;
