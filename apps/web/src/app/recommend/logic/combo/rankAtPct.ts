import { MIN_RANKABLE_PERCENT } from '@/app/recommend/constants/comboThresholds';

/** 비율이 일정 이상인 행만 모아 N등(1-based) 값을 고른다 */

const pickAtRankByPct = <T extends { percentage: number }>(
  rows: T[],
  rank1: number,
  tieCompare: (a: T, b: T) => number,
  pickValue: (row: T) => number,
): number | null => {
  const eligible = rows.filter((r) => r.percentage > MIN_RANKABLE_PERCENT);
  const sorted = [...eligible].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return tieCompare(a, b);
  });
  if (sorted.length < rank1) return null;
  const row = sorted[rank1 - 1];
  return row !== undefined ? pickValue(row) : null;
};

export const evenCountAtRank = (
  rows: { percentage: number; evenCount: number }[],
  rank1: number,
): number | null =>
  pickAtRankByPct(rows, rank1, (a, b) => a.evenCount - b.evenCount, (r) => r.evenCount);
