import type { GapRankRow } from '@/app/recommend/types/gapRank';

/** 최대 근접 → 같은 거리면 미추첨 기간 긴 순 → 미출현 하단 → 번호 오름차순 */

export const compareGapRows = (a: GapRankRow, b: GapRankRow): number => {
  const distA = a.distance ?? Number.POSITIVE_INFINITY;
  const distB = b.distance ?? Number.POSITIVE_INFINITY;
  if (distA !== distB) return distA - distB;
  const curA = a.currentGap ?? -1;
  const curB = b.currentGap ?? -1;
  if (curA !== curB) return curB - curA;
  return a.number - b.number;
};
