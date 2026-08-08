import type { GapRankRow } from '@/app/recommend/types/gapRank';

/** 현재가 과거 최대를 넘겼으면 초과폭, 아니면 null */

export const overdueExcess = (row: GapRankRow): number | null => {
  if (row.maxGap === null || row.currentGap === null) return null;
  if (row.currentGap <= row.maxGap) return null;
  return row.currentGap - row.maxGap;
};

/** 최대 초과 최우선 → 최대 근접 → 최대 없음 하단 → 번호 오름차순 */

export const compareGapRows = (a: GapRankRow, b: GapRankRow): number => {
  const excessA = overdueExcess(a);
  const excessB = overdueExcess(b);
  const overdueA = excessA !== null;
  const overdueB = excessB !== null;
  if (overdueA !== overdueB) return overdueA ? -1 : 1;
  if (overdueA && overdueB) {
    if (excessA !== excessB) return excessB! - excessA!;
    return a.number - b.number;
  }
  const distA = a.distance ?? Number.POSITIVE_INFINITY;
  const distB = b.distance ?? Number.POSITIVE_INFINITY;
  if (distA !== distB) return distA - distB;
  return a.number - b.number;
};
