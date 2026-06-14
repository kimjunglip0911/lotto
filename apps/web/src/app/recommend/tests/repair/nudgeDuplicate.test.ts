import { describe, expect, it } from 'vitest';
import {
  buildPositionDrawCountLookup,
  buildPositionRankLookup,
  rankAtPosition,
} from '@/app/recommend/helpers/positionRankLookup';
import { nudgeDuplicateCombo } from '@/app/recommend/logic/repair/nudgeDuplicate';
import { orderedSwapPositionsByDrawCount } from '@/app/recommend/logic/repair/nudgeSwap';
import { pickMinAppearPosition } from '@/app/recommend/logic/repair/repairPos';
import { buildPoolByBand } from '@/app/recommend/logic/repair';
import { setKey } from '@/app/recommend/logic/combo/toSet';

const emptyHist = (): number[] => Array.from({ length: 45 }, () => 0);

const statLookupsFromEntries = (
  entries: readonly { position: number; num: number; rank: number; drawCount: number }[],
) => {
  const rows = entries.map(({ position, num, rank, drawCount }) => ({
    position,
    bandLabel: String(num),
    drawCount,
    percentage: 1,
    rank,
  }));
  return {
    positionRankLookup: buildPositionRankLookup(rows),
    positionDrawCountLookup: buildPositionDrawCountLookup(rows),
  };
};

describe('pickMinAppearPosition', () => {
  it('drawCount가 가장 낮은 구간 인덱스를 고른다', () => {
    const { positionRankLookup, positionDrawCountLookup } = statLookupsFromEntries([
      { position: 1, num: 1, rank: 1, drawCount: 20 },
      { position: 2, num: 6, rank: 1, drawCount: 10 },
      { position: 3, num: 9, rank: 1, drawCount: 8 },
      { position: 4, num: 15, rank: 1, drawCount: 3 },
      { position: 5, num: 27, rank: 1, drawCount: 12 },
      { position: 6, num: 45, rank: 1, drawCount: 5 },
    ]);

    expect(
      pickMinAppearPosition([1, 6, 9, 15, 27, 45], {
        positionRankLookup,
        positionDrawCountLookup,
      }),
    ).toBe(3);
  });

  it('rank가 모두 1이어도 drawCount 차이로 1구가 아닌 구간을 고른다', () => {
    const picked = [1, 9, 15, 27, 31, 45];
    const { positionRankLookup, positionDrawCountLookup } = statLookupsFromEntries([
      { position: 1, num: 1, rank: 1, drawCount: 18 },
      { position: 2, num: 9, rank: 1, drawCount: 12 },
      { position: 3, num: 15, rank: 1, drawCount: 11 },
      { position: 4, num: 27, rank: 1, drawCount: 9 },
      { position: 5, num: 31, rank: 1, drawCount: 8 },
      { position: 6, num: 45, rank: 1, drawCount: 4 },
    ]);

    const order = orderedSwapPositionsByDrawCount(picked, {
      positionRankLookup,
      positionDrawCountLookup,
    });
    expect(order[0]).toBe(5);
    expect(order[0]).not.toBe(0);
  });

  it('drawCount lookup이 없으면 구간별 rank로 고른다', () => {
    const { positionRankLookup } = statLookupsFromEntries([
      { position: 1, num: 1, rank: 1, drawCount: 20 },
      { position: 2, num: 6, rank: 6, drawCount: 10 },
      { position: 3, num: 9, rank: 17, drawCount: 8 },
      { position: 4, num: 15, rank: 19, drawCount: 3 },
      { position: 5, num: 27, rank: 3, drawCount: 12 },
      { position: 6, num: 31, rank: 12, drawCount: 5 },
    ]);

    expect(
      pickMinAppearPosition([1, 6, 9, 15, 27, 31], { positionRankLookup }),
    ).toBe(3);
  });

  it('lookup이 없으면 당첨 이력 출현 횟수를 쓴다', () => {
    const histCounts = emptyHist();
    histCounts[44] = 2;
    for (const n of [1, 9, 15, 27, 31]) histCounts[n - 1] = 10;

    expect(pickMinAppearPosition([1, 9, 15, 27, 31, 45], { histCounts })).toBe(5);
  });
});

describe('nudgeDuplicateCombo', () => {
  it('drawCount가 낮은 4구(15번)을 교체해 중복 조합을 피한다', () => {
    const base = [1, 6, 9, 15, 27, 31];
    const { positionRankLookup, positionDrawCountLookup } = statLookupsFromEntries([
      { position: 1, num: 1, rank: 1, drawCount: 20 },
      { position: 2, num: 6, rank: 1, drawCount: 12 },
      { position: 3, num: 9, rank: 1, drawCount: 10 },
      { position: 4, num: 15, rank: 1, drawCount: 3 },
      { position: 5, num: 27, rank: 1, drawCount: 11 },
      { position: 6, num: 31, rank: 1, drawCount: 9 },
      { position: 4, num: 16, rank: 2, drawCount: 4 },
    ]);

    const usage = new Map<number, number>();
    for (let n = 1; n <= 45; n++) usage.set(n, 0);

    const poolByBand = buildPoolByBand(Array.from({ length: 45 }, (_, i) => i + 1));
    const blocked = new Set<string>([setKey(base)]);
    const pickCtx = { usage, positionRankLookup, positionDrawCountLookup };
    const bandTargets = [0, 5, 8, 14, 26, 30];
    const constraints = {
      minSum: 80,
      maxSum: 200,
      bandTargets,
      bandLadder: bandTargets.map((b, i) => (i === 3 ? [b, b + 1] : [b])),
    };

    const next = nudgeDuplicateCombo(base, constraints, poolByBand, pickCtx, blocked);
    expect(next).not.toBeNull();
    expect(next![0]).toBe(1);
    expect(next!.filter((n) => n === 15)).toHaveLength(0);
    expect(next!.filter((n) => n === 6)).toHaveLength(1);
    expect(rankAtPosition(positionRankLookup, 2, next![1]!)).toBe(1);
  });
});
