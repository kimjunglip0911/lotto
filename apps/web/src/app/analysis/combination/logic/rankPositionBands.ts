/**
 * 자리별 번호대(1~45)를 출현 비율 순으로 1등~꼴등 순위를 매긴다.
 * 조합 분석 표·추천 생성이 같은 순위 규칙을 쓰도록 공용 로직으로 둔다.
 */
import { NUMBER_BAND_LABELS } from '../constants/bandLabels';
import type { PositionBandDistributionRow, PositionBandRankRow } from '../types';

export const bandIndexFromLabel = (bandLabel: string): number => {
  const idx = NUMBER_BAND_LABELS.indexOf(bandLabel as (typeof NUMBER_BAND_LABELS)[number]);
  return idx >= 0 ? idx : 0;
};

export const sortRowsForPosition = (
  rows: readonly PositionBandDistributionRow[],
): PositionBandDistributionRow[] =>
  [...rows].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return bandIndexFromLabel(a.bandLabel) - bandIndexFromLabel(b.bandLabel);
  });

export const distinctBandIndices = (
  sorted: readonly PositionBandDistributionRow[],
): number[] => {
  const ranks: number[] = [];
  const seen = new Set<number>();
  for (const row of sorted) {
    const b = bandIndexFromLabel(row.bandLabel);
    if (seen.has(b)) continue;
    seen.add(b);
    ranks.push(b);
  }
  return ranks;
};

/** rankIdx는 0부터(1등=0). distinct band가 부족하면 정렬 목록 tail로 보충한다. */
export const pickBandIndexForRank = (
  sorted: readonly PositionBandDistributionRow[],
  rankIdx: number,
): number | null => {
  const distinctRanks = distinctBandIndices(sorted);
  if (distinctRanks.length > rankIdx) return distinctRanks[rankIdx]!;
  if (sorted.length > rankIdx) return bandIndexFromLabel(sorted[rankIdx]!.bandLabel);
  if (sorted.length > 0) return bandIndexFromLabel(sorted[sorted.length - 1]!.bandLabel);
  return null;
};

export function rankPositionBandRows(
  rows: readonly PositionBandDistributionRow[],
): PositionBandRankRow[] {
  const result: PositionBandRankRow[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const sorted = sortRowsForPosition(rows.filter((r) => r.position === pos));
    sorted.forEach((row, idx) => {
      result.push({ ...row, rank: idx + 1 });
    });
  }
  return result;
}
