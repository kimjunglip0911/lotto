import { describe, expect, it } from 'vitest';
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';
import {
  buildPoolByBand,
  collectBandCands,
  isBandFallbackOk,
  matchesBandTarget,
  randomPerPositionPick,
  validatePickedSet,
} from '@/app/recommend/logic/repair';

describe('bandFallback', () => {
  it('isBandFallbackOk: band1~3 목표일 때 band4~6만 허용', () => {
    expect(isBandFallbackOk(0, 3)).toBe(true);
    expect(isBandFallbackOk(2, 5)).toBe(true);
    expect(isBandFallbackOk(0, 0)).toBe(false);
    expect(isBandFallbackOk(3, 0)).toBe(false);
    expect(isBandFallbackOk(0, 6)).toBe(false);
  });

  it('matchesBandTarget: 목표 band 또는 폴백 band면 통과', () => {
    expect(matchesBandTarget(0, 0)).toBe(true);
    expect(matchesBandTarget(0, 4)).toBe(true);
    expect(matchesBandTarget(0, 1)).toBe(false);
  });

  it('collectBandCands: band1~3 비었으면 band4~6 후보 반환', () => {
    const poolByBand = buildPoolByBand([16, 17, 18, 19, 20, 21, 22, 23]);
    const used = new Set<number>();
    const usage = new Map<number, number>();
    for (const n of [16, 17, 18, 19, 20, 21, 22, 23]) usage.set(n, 0);

    const cands = collectBandCands(poolByBand, 0, used, { usage });
    expect(cands.length).toBeGreaterThan(0);
    expect(cands.every((n) => numberToBandIndex(n) >= 3 && numberToBandIndex(n) <= 5)).toBe(true);
  });

  it('collectBandCands: 목표 band에 번호 있으면 폴백 미사용', () => {
    const poolByBand = buildPoolByBand([1, 2, 16, 17]);
    const used = new Set<number>();
    const usage = new Map<number, number>([
      [1, 0],
      [2, 0],
      [16, 0],
      [17, 0],
    ]);

    const cands = collectBandCands(poolByBand, 0, used, { usage });
    expect(cands).toEqual([1, 2]);
  });

  it('validatePickedSet: band1 목표에 band4 번호 허용', () => {
    const constraints = {
      minSum: 50,
      maxSum: 200,
      evenT: 3,
      bandTargets: [0, 1, 2, 2, 2, 5],
    };
    const picked = [16, 6, 12, 13, 21, 26];
    const state = validatePickedSet(picked, constraints);
    expect(state.violations).not.toContain('band');
  });

  it('randomPerPositionPick: band1~3 비었을 때 band4~6에서 뽑는다', () => {
    const poolByBand = buildPoolByBand([16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]);
    const bandTargets = [0, 0, 0, 0, 0, 0];
    const usage = new Map<number, number>();
    for (let i = 16; i <= 27; i++) usage.set(i, 0);

    const picked = randomPerPositionPick(poolByBand, bandTargets, { usage });
    expect(picked).not.toBeNull();
    expect(picked!.every((n) => numberToBandIndex(n) >= 3 && numberToBandIndex(n) <= 5)).toBe(true);
  });
});
