import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

/** 번호 풀에 있는 번호만 간격순위 lookup에 남긴다 */

export const keepPoolGapLookup = (
  lookup: GapRankLookup,
  pool: readonly number[],
): GapRankLookup => {
  const allowed = new Set(pool);
  const next = new Map<number, GapRankRow>();
  for (const [n, row] of lookup) {
    if (allowed.has(n)) next.set(n, row);
  }
  return next;
};

/** leftover 풀 번호를 1등부터 다시 매긴다 */

export const rerankGapLookup = (lookup: GapRankLookup): GapRankLookup => {
  const rows = [...lookup.values()].sort(
    (a, b) => a.rank - b.rank || a.number - b.number,
  );
  return new Map(
    rows.map((row, index) => [row.number, { ...row, rank: index + 1 }]),
  );
};
