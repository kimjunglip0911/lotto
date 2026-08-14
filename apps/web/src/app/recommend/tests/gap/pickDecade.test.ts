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

describe('pickDecadeGapNumbers', () => {
  it('6세트는 1등부터 번호대 칸을 채운다', () => {
    expect(pickDecadeGapNumbers(fullLookup(), decadeQuota(6)!)).toEqual([
      1, 10, 20, 21, 30, 40,
    ]);
  });

  it('제외 등수는 같은 번호대 다음 순위로 채운다', () => {
    const lookup = fullLookup();
    lookup.delete(1);
    expect(pickDecadeGapNumbers(lookup, decadeQuota(6)!)).toEqual([
      2, 10, 20, 21, 30, 40,
    ]);
  });

  it('번호대가 모자라면 남은 최고 등수로 채운다', () => {
    const lookup = fullLookup();
    for (let n = 40; n <= 45; n++) lookup.delete(n);
    expect(pickDecadeGapNumbers(lookup, decadeQuota(6)!)).toEqual([
      1, 10, 20, 21, 30, 2,
    ]);
  });
});
