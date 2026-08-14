import { describe, expect, it } from 'vitest';
import { keepPoolGapLookup, rerankGapLookup } from '@/app/recommend/logic/gap/keepPoolGaps';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  maxGap: rank,
  distance: 0,
});

const lookupOf = (entries: readonly [number, number][]): GapRankLookup =>
  new Map(entries.map(([num, rank]) => [num, gapRow(num, rank)]));

describe('keepPoolGaps', () => {
  it('풀에 있는 번호만 남긴다', () => {
    const kept = keepPoolGapLookup(lookupOf([[1, 11], [2, 17], [3, 23]]), [1, 3]);
    expect([...kept.keys()].sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it('남은 번호를 1등부터 다시 매긴다', () => {
    const reranked = rerankGapLookup(lookupOf([[5, 17], [2, 11], [9, 23]]));
    expect(reranked.get(2)?.rank).toBe(1);
    expect(reranked.get(5)?.rank).toBe(2);
    expect(reranked.get(9)?.rank).toBe(3);
  });
});
