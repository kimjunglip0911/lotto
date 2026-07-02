import { describe, expect, it } from 'vitest';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import { buildPositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import { orderCandidatesByPriority } from '@/app/recommend/logic/repair/diverse';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  distance: 0,
});

const gapLookup = (entries: readonly [number, number][]): GapRankLookup =>
  new Map(entries.map(([num, rank]) => [num, gapRow(num, rank)]));

const rankLookup = (entries: readonly { num: number; rank: number }[]) =>
  buildPositionRankLookup(
    entries.map(({ num, rank }) => ({
      position: 1,
      bandLabel: String(num),
      drawCount: 1,
      percentage: 1,
      rank,
    })),
  );

const pool = (): Map<number, number[]> =>
  new Map([
    [0, [7, 8]],
    [1, [11]],
    [2, [12]],
    [3, [13]],
    [4, [14]],
    [5, [15]],
  ]);

describe('orderCandidatesByPriority (repair nudge)', () => {
  it('간격 1등이면 구간 순위가 낮아도 먼저 고른다', () => {
    const ordered = orderCandidatesByPriority([7, 8], {
      gapRankLookup: gapLookup([
        [7, 1],
        [8, 2],
      ]),
      positionRankLookup: rankLookup([
        { num: 7, rank: 3 },
        { num: 8, rank: 1 },
      ]),
    });

    expect(ordered[0]).toBe(7);
  });

  it('간격 순위가 같으면 구간별 순위가 높은 번호를 먼저 고른다', () => {
    const ordered = orderCandidatesByPriority([7, 8], {
      gapRankLookup: gapLookup([
        [7, 1],
        [8, 1],
      ]),
      positionRankLookup: rankLookup([
        { num: 7, rank: 3 },
        { num: 8, rank: 1 },
      ]),
    }, 1);

    expect(ordered[0]).toBe(8);
  });
});

describe('sequentialPickByBands (section path)', () => {
  it('사용 한도에 걸린 번호는 건너뛴다', () => {
    const usage = new Map<number, number>([[7, MAX_NUM_USAGE]]);
    const picked = sequentialPickByBands(pool(), [0, 1, 2, 3, 4, 5], 0, 999, {
      usage,
    });

    expect(picked?.[0]).toBe(8);
  });
});
