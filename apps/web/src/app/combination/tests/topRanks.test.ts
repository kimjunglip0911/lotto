import { describe, expect, it } from 'vitest';
import { takeTopRanks } from '../logic/topRanks';
import type { PositionBandRankRow } from '../types';

const row = (rank: number): PositionBandRankRow => ({
  position: 1,
  bandLabel: String(rank),
  drawCount: 13 - rank,
  percentage: 13 - rank,
  rank,
});

describe('takeTopRanks', () => {
  it('한 자리에서 10등까지만 남긴다', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(i + 1));
    const top = takeTopRanks(rows);
    expect(top).toHaveLength(10);
    expect(top.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
