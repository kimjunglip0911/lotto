import { describe, expect, it } from 'vitest';
import { decadeQuota } from '@/app/recommend/constants/decadeQuota';
import { pickDecadeGapNumbers } from '@/app/recommend/logic/gap/pickDecade';
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

const fullLookup = (): GapRankLookup =>
  new Map(
    Array.from({ length: 45 }, (_, i) => {
      const n = i + 1;
      return [n, gapRow(n, n)] as const;
    }),
  );

describe('pickDecadeGapNumbers taken', () => {
  it('6~10세트는 서로 다른 30개 번호를 쓴다', () => {
    const lookup = fullLookup();
    const taken = new Set<number>();
    const all: number[] = [];
    for (const rank of [6, 7, 8, 9, 10]) {
      const picked = pickDecadeGapNumbers(lookup, decadeQuota(rank)!, taken);
      expect(picked).toEqual(expect.any(Array));
      for (const n of picked!) {
        expect(taken.has(n)).toBe(false);
        taken.add(n);
      }
      all.push(...picked!);
    }
    expect(new Set(all).size).toBe(30);
    expect(all).toEqual([
      1, 10, 20, 21, 30, 40, 2, 11, 22, 31, 32, 41, 3, 12, 13, 23, 24, 33, 14,
      15, 25, 26, 34, 35, 4, 27, 28, 29, 36, 42,
    ]);
  });
});
