import { describe, expect, it } from 'vitest';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
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

  it('rank19도 rank1과 동일 band ladder로 세트를 만든다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 3, 8, 15, 22, 30];
    const bandLadder = bandTargets.map((b, i) => [b, b + 1, b + 2 + i, b + 3]);

    const mk = () => ({
      usage: new Map<number, number>(pool.map((n) => [n, 0])),
      innerSlotUsage: new Map<string, number>(),
      usedKeys: new Set<string>(),
    });

    const ctx1 = mk();
    const rank1 = await findOneSetForRank(
      poolByBand, 100, 200, 1, bandTargets, bandLadder,
      ctx1.usedKeys, ctx1.usage, ctx1.innerSlotUsage, 0,
    );
    const ctx19 = mk();
    const rank19 = await findOneSetForRank(
      poolByBand, 100, 200, 19, bandTargets, bandLadder,
      ctx19.usedKeys, ctx19.usage, ctx19.innerSlotUsage, 0,
    );

    expect(rank1).not.toBeNull();
    expect(rank19).not.toBeNull();
    expect(rank19!.strategy).toBe('combo:rank19');
  });
});
