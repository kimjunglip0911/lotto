import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import {
  BAND_COUNT,
  BAND_WIDTH,
  NUMBER_BAND_LABELS,
} from '@/app/analysis/combination/constants/bandLabels';
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';
import type { PositionBandDistributionRow } from '@/app/analysis/combination/types';
import { MIN_BAND_TIER_PERCENT, MIN_RANKABLE_PERCENT } from '@/app/recommend/constants/comboThresholds';

/** 자리별 band 목표·구간 유틸 */

export const withSortedMains = (row: WinningNumberRow): WinningNumberRow => {
  const m = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6].sort((a, b) => a - b);
  return { ...row, num1: m[0]!, num2: m[1]!, num3: m[2]!, num4: m[3]!, num5: m[4]!, num6: m[5]! };
};

const bandIndexFromRow = (row: PositionBandDistributionRow): number => {
  const idx = NUMBER_BAND_LABELS.indexOf(row.bandLabel as (typeof NUMBER_BAND_LABELS)[number]);
  return idx >= 0 ? idx : 0;
};

export const bandStartForIndex = (bandIndex: number): number => bandIndex * BAND_WIDTH + 1;

export const bandInnerSlot = (n: number): number => n - bandStartForIndex(numberToBandIndex(n));

export const innerSlotKey = (n: number): string => {
  const b = numberToBandIndex(n);
  return `${b}:${n - bandStartForIndex(b)}`;
};

export const areBandTargetsMonotonic = (bandTargets: readonly number[]): boolean => {
  for (let i = 1; i < bandTargets.length; i++) {
    if (bandTargets[i]! < bandTargets[i - 1]!) return false;
  }
  return true;
};

const MAX_BAND_INDEX = BAND_COUNT - 1;

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

const pickBandIndexForPosition = (
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

export const makeMonotonicBandTargets = (raw: readonly number[]): number[] => {
  const out = [...raw];
  for (let i = 1; i < out.length; i++) {
    if (out[i]! < out[i - 1]!) out[i] = out[i - 1]!;
  }
  return out;
};

const differentiateBandTargetsFromPrev = (
  targets: readonly number[],
  prev: readonly number[],
): number[] => {
  const out = [...targets];
  const same = out.length === prev.length && out.every((v, i) => v === prev[i]);
  if (!same) return out;
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i]! < MAX_BAND_INDEX) {
      out[i] = out[i]! + 1;
      return out;
    }
  }
  return out;
};

export const buildBandTargetsPerPosition = (
  flat: readonly PositionBandDistributionRow[],
  bandTier: number,
  prevTierTargets?: readonly number[] | null,
): number[] | null => {
  const rankIdx = bandTier - 1;
  const targets: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const forPos = flat.filter((r) => r.position === pos);
    const sorted = [...forPos].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return bandIndexFromRow(a) - bandIndexFromRow(b);
    });
    if (sorted.length === 0) return null;
    const effRank = bandTier <= 3 ? effectiveBandRankIdx(sorted, rankIdx) : rankIdx;
    const picked = pickBandIndexForPosition(sorted, effRank);
    if (picked === null) return null;
    targets.push(picked);
  }
  if (prevTierTargets) {
    return differentiateBandTargetsFromPrev(targets, prevTierTargets);
  }
  return targets;
};

export const evenCountAtRank = (
  rows: { percentage: number; evenCount: number }[],
  rank1: number,
): number | null => {
  const eligible = rows.filter((r) => r.percentage > MIN_RANKABLE_PERCENT);
  const sorted = [...eligible].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return a.evenCount - b.evenCount;
  });
  if (sorted.length < rank1) return null;
  return sorted[rank1 - 1]?.evenCount ?? null;
};

export const maxRunAtRank = (
  rows: { percentage: number; maxRunLength: number }[],
  rank1: number,
): number | null => {
  const eligible = rows.filter((r) => r.percentage > MIN_RANKABLE_PERCENT);
  const sorted = [...eligible].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return a.maxRunLength - b.maxRunLength;
  });
  if (sorted.length < rank1) return null;
  const v = sorted[rank1 - 1]?.maxRunLength;
  return v !== undefined ? v : null;
};
