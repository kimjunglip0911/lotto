import { describe, expect, it } from 'vitest';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import { buildPositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import { orderCandidatesByPriority } from '@/app/recommend/logic/repair/diverse';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';

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
  it('구간별 순위가 높은 번호를 먼저 고른다', () => {
    const ordered = orderCandidatesByPriority(
      [7, 8],
      {
        positionRankLookup: rankLookup([
          { num: 7, rank: 3 },
          { num: 8, rank: 1 },
        ]),
      },
      1,
    );
    expect(ordered[0]).toBe(8);
  });
});

describe('sequentialPickByBands (section path)', () => {
  it('사용 한도 비활성 시 한도 도달 번호도 고른다', () => {
    const usage = new Map<number, number>([[7, MAX_NUM_USAGE]]);
    const picked = sequentialPickByBands(pool(), [0, 1, 2, 3, 4, 5], 0, 999, {
      usage,
    });
    expect(picked?.[0]).toBe(7);
  });
});
