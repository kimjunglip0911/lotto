import { describe, expect, it } from 'vitest';
import {
  buildPoolByBand,
  collectBandCands,
  matchesBandTarget,
  randomPerPositionPick,
  validatePickedSet,
} from '@/app/recommend/logic/repair';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';

describe('bandFallback', () => {
  it('matchesBandTarget: 목표 band와 일치할 때만 통과', () => {
    expect(matchesBandTarget(0, 0)).toBe(true);
    expect(matchesBandTarget(0, 16)).toBe(false);
    expect(matchesBandTarget(0, 4)).toBe(false);
  });

  it('collectBandCands: 풀에 해당 band 번호가 없으면 빈 배열', () => {
    const poolByBand = buildPoolByBand([16, 17, 18, 19, 20, 21, 22, 23]);
    const used = new Set<number>();
    const usage = new Map<number, number>();
    for (const n of [16, 17, 18, 19, 20, 21, 22, 23]) usage.set(n, 0);

    expect(collectBandCands(poolByBand, 0, used, { usage })).toEqual([]);
  });

  it('collectBandCands: 목표 band에 번호 있으면 해당 번호만 반환', () => {
    const poolByBand = buildPoolByBand([1, 2, 16, 17]);
    const used = new Set<number>();
    const usage = new Map<number, number>([
      [1, 0],
      [2, 0],
      [16, 0],
      [17, 0],
    ]);

    const cands = collectBandCands(poolByBand, 0, used, { usage });
    expect(cands).toEqual([1]);
  });

  it('collectBandCands: 한도 소진이면 빈 배열(ladder 다음 등수)', () => {
    const poolByBand = buildPoolByBand(Array.from({ length: 45 }, (_, i) => i + 1));
    const usage = new Map<number, number>([[1, 3]]);

    expect(collectBandCands(poolByBand, 0, new Set(), { usage })).toEqual([]);
    expect(collectBandCands(poolByBand, 2, new Set(), { usage })).toEqual([3]);
  });

  it('validatePickedSet: band가 ladder에 없으면 band 위반', () => {
    const constraints = {
      minSum: LOTTO_SUM_MIN,
      maxSum: LOTTO_SUM_MAX,
      bandTargets: [0, 1, 2, 2, 2, 5],
    };
    const picked = [16, 17, 18, 19, 20, 21];
    const state = validatePickedSet(picked, constraints);
    expect(state.violations).toContain('band');
  });

  it('randomPerPositionPick: 목표 band가 비어 있으면 null', () => {
    const poolByBand = buildPoolByBand([16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]);
    const bandTargets = [0, 0, 0, 0, 0, 0];
    const usage = new Map<number, number>();
    for (let i = 16; i <= 27; i++) usage.set(i, 0);

    const picked = randomPerPositionPick(poolByBand, bandTargets, { usage });
    expect(picked).toBeNull();
  });
});
