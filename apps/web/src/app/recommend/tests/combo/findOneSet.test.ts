import { describe, expect, it } from 'vitest';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { TAIL_UNUSED_RANK_START } from '@/app/recommend/constants/comboThresholds';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { buildPoolByBand } from '@/app/recommend/logic/repair';

describe('findOneSetForRank', () => {
  it('동일 band ladder에서 rank2는 rank1과 다른 조합을 만든다', async () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 5, 10, 15, 20, 25];
    const bandLadder = bandTargets.map((b) => [b, b + 1]);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();

    const rank1 = await findOneSetForRank(
      poolByBand,
      80,
      160,
      1,
      bandTargets,
      bandLadder,
      usedKeys,
      usage,
      innerSlotUsage,
      0,
    );
    const rank2 = await findOneSetForRank(
      poolByBand,
      80,
      160,
      2,
      bandTargets,
      bandLadder,
      usedKeys,
      usage,
      innerSlotUsage,
      0,
    );

    expect(rank1).not.toBeNull();
    expect(rank2).not.toBeNull();
    const key1 = setKey([rank1!.num1, rank1!.num2, rank1!.num3, rank1!.num4, rank1!.num5, rank1!.num6]);
    const key2 = setKey([rank2!.num1, rank2!.num2, rank2!.num3, rank2!.num4, rank2!.num5, rank2!.num6]);
    expect(key2).not.toBe(key1);
  });

  it('rank1~3 tier가 같아도 슬롯마다 서로 다른 조합을 채울 수 있다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 3, 8, 15, 22, 30];
    const bandLadder = bandTargets.map((b, i) => [b, b + 1, b + 2 + i]);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();
    const keys: string[] = [];

    for (const rank of COMBO_RANK_SLOT_ORDER.slice(0, 3)) {
      const one = await findOneSetForRank(
        poolByBand,
        100,
        180,
        rank,
        bandTargets,
        bandLadder,
        usedKeys,
        usage,
        innerSlotUsage,
        0,
      );
      expect(one).not.toBeNull();
      keys.push(
        setKey([one!.num1, one!.num2, one!.num3, one!.num4, one!.num5, one!.num6]),
      );
    }

    expect(new Set(keys).size).toBe(3);
  });

  it('rank19는 미사용 번호·고저 무시로 세트를 만든다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 3, 8, 15, 22, 30];
    const bandLadder = bandTargets.map((b) => [b]);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    for (let n = 1; n <= 35; n++) usage.set(n, 2);
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();

    const rank19 = await findOneSetForRank(
      poolByBand,
      500,
      600,
      TAIL_UNUSED_RANK_START,
      bandTargets,
      bandLadder,
      usedKeys,
      usage,
      innerSlotUsage,
      0,
    );

    expect(rank19).not.toBeNull();
    const nums = [rank19!.num1, rank19!.num2, rank19!.num3, rank19!.num4, rank19!.num5, rank19!.num6];
    expect(nums.every((n) => n >= 36)).toBe(true);
    const sum = nums.reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThan(500);
  });
});
