import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 번호 풀에 있는 번호만 간격순위 lookup에 남긴다 */

export const keepPoolGapLookup = (
  lookup: GapRankLookup,
  pool: readonly number[],
): GapRankLookup => {
  const allowed = new Set(pool);
  const next: GapRankLookup = new Map();
  for (const [n, row] of lookup) {
    if (allowed.has(n)) next.set(n, row);
  }
  return next;
};
