import { describe, expect, it } from 'vitest';
import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX, MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import type { FillCtx } from '@/app/recommend/logic/combo/fillSlots';
import { fillFallbackSlots, findFallbackSetBacktrack } from '@/app/recommend/logic/combo/fillFallback';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { buildPoolByBand } from '@/app/recommend/logic/repair';

const mkCtx = (pool: number[]): FillCtx => {
  const usage = new Map<number, number>(pool.map((n) => [n, 0]));
  return {
    poolByBand: buildPoolByBand(pool),
    minSum: 21,
    maxSum: 300,
    oddRows: [],
    consecRows: [],
    targetsByBandTier: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
    usedKeys: new Set<string>(),
    usage,
    innerSlotUsage: new Map<string, number>(),
    repairYieldEvery: 0,
    profileSlots: Array.from({ length: COMBO_PROFILE_SLOT_ORDER.length }, () => null),
  };
};

describe('fillFallbackSlots', () => {
  it('빈 슬롯을 번호 풀만으로 폴백 세트를 채운다', () => {
    const pool = Array.from({ length: 20 }, (_, i) => i + 1);
    const ctx = mkCtx(pool);
    ctx.profileSlots[0] = {
      num1: 1,
      num2: 2,
      num3: 3,
      num4: 4,
      num5: 5,
      num6: 6,
      method: 'JL Wheel Method',
      strategy: 'combo:oe1-run1-band1',
    };
    ctx.usedKeys.add('1,2,3,4,5,6');
    for (const n of [1, 2, 3, 4, 5, 6]) ctx.usage.set(n, 1);

    const result = fillFallbackSlots(ctx, pool);

    expect(result.filled).toBeGreaterThan(0);
    for (const s of ctx.profileSlots) {
      if (!s?.strategy?.startsWith(FALLBACK_STRATEGY_PREFIX)) continue;
      const nums = [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6];
      expect(new Set(nums).size).toBe(6);
      for (const n of nums) {
        expect((ctx.usage.get(n) ?? 0)).toBeLessThanOrEqual(MAX_NUM_USAGE);
      }
    }
  });

  it('6개 조합 중복은 허용하지 않는다', () => {
    const pool = Array.from({ length: 12 }, (_, i) => i + 1);
    const ctx = mkCtx(pool);
    const dupKey = setKey([1, 2, 3, 4, 5, 6]);
    ctx.usedKeys.add(dupKey);

    fillFallbackSlots(ctx, pool);

    for (const s of ctx.profileSlots) {
      if (!s) continue;
      expect(setKey([s.num1, s.num2, s.num3, s.num4, s.num5, s.num6])).not.toBe(dupKey);
    }
  });

  it('findFallbackSetBacktrack는 탐욕 실패 후에도 유효 조합을 찾는다', () => {
    const usage = new Map<number, number>([
      [1, 3],
      [2, 3],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      [8, 0],
    ]);
    const usedKeys = new Set<string>();
    const found = findFallbackSetBacktrack([1, 2, 3, 4, 5, 6, 7, 8], usage, usedKeys);
    expect(found).toEqual([3, 4, 5, 6, 7, 8]);
  });
});
