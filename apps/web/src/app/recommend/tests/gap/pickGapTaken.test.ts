import { describe, expect, it } from 'vitest';
import { pickGapSetNumbers } from '@/app/recommend/logic/combo/findOneGapSet';
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

describe('pickGapSetNumbers taken', () => {
  it('1~5세트는 서로 다른 30개 번호를 쓴다', () => {
    const taken = new Set<number>();
    const all: number[] = [];
    for (let rank = 1; rank <= 5; rank++) {
      const picked = pickGapSetNumbers(rank, fullLookup(), new Map(), undefined, taken);
      expect(picked).toHaveLength(6);
      for (const n of picked!) {
        expect(taken.has(n)).toBe(false);
        taken.add(n);
      }
      all.push(...picked!);
    }
    expect(new Set(all).size).toBe(30);
    expect(all).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
  it('이미 쓴 번호는 다음 등수로 건너뛴다', () => {
    const picked = pickGapSetNumbers(
      2,
      fullLookup(),
      new Map(),
      undefined,
      new Set([7]),
    );
    expect(picked).toEqual([8, 9, 10, 11, 12, 13]);
  });
});
