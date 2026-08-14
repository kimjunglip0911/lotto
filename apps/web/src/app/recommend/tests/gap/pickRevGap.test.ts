import { describe, expect, it } from 'vitest';
import { pickRevGapNumbers } from '@/app/recommend/logic/gap/pickRevGap';
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

describe('pickRevGapNumbers', () => {
  it('6세트는 45등부터 6칸이다', () => {
    expect(pickRevGapNumbers(6, fullLookup())).toEqual([45, 44, 43, 42, 41, 40]);
  });

  it('제외 등수는 다음(더 낮은) 순위로 채운다', () => {
    const lookup = fullLookup();
    lookup.delete(45);
    expect(pickRevGapNumbers(6, lookup)).toEqual([44, 43, 42, 41, 40, 39]);
  });

  it('6~10세트는 서로 다른 30개 번호를 쓴다', () => {
    const taken = new Set<number>();
    const all: number[] = [];
    for (const rank of [6, 7, 8, 9, 10]) {
      const picked = pickRevGapNumbers(rank, fullLookup(), taken);
      expect(picked).toHaveLength(6);
      for (const n of picked!) {
        expect(taken.has(n)).toBe(false);
        taken.add(n);
      }
      all.push(...picked!);
    }
    expect(new Set(all).size).toBe(30);
    expect(all[all.length - 1]).toBe(16);
  });
});
