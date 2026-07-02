import { describe, expect, it } from 'vitest';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';
import { findOneSetForRank } from '@/app/recommend/logic/combo/findOneSet';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { buildPoolByBand } from '@/app/recommend/logic/repair';

const ZERO_HIST = Array.from({ length: 45 }, () => 0);
const EMPTY_RANK_LOOKUP = new Map<string, number>();
const EMPTY_DRAW_LOOKUP = new Map<string, number>();

const callFindOne = (
  poolByBand: ReadonlyMap<number, number[]>,
  rank: number,
  bandTargets: readonly number[],
  bandLadder: readonly (readonly number[])[],
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  repairYieldEvery = 0,
  avoidKeys: ReadonlySet<string> = new Set(),
) =>
  findOneSetForRank(
    poolByBand,
    LOTTO_SUM_MIN,
    LOTTO_SUM_MAX,
    rank,
    bandTargets,
    bandLadder,
    usedKeys,
    usage,
    innerSlotUsage,
    ZERO_HIST,
    EMPTY_RANK_LOOKUP,
    EMPTY_DRAW_LOOKUP,
    repairYieldEvery,
    avoidKeys,
  );

describe('findOneSetForRank', () => {
  it('rank2는 rank1과 다른 band tier에서 시작한다', async () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargetsRank1 = [0, 5, 10, 15, 20, 25];
    const bandLadderRank1 = bandTargetsRank1.map((b) => [b, b + 1]);
    const bandTargetsRank2 = bandTargetsRank1.map((b) => b + 1);
    const bandLadderRank2 = bandTargetsRank2.map((b) => [b, b + 1]);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();

    const rank1 = await callFindOne(
      poolByBand,
      1,
      bandTargetsRank1,
      bandLadderRank1,
      usedKeys,
      usage,
      innerSlotUsage,
    );
    const rank2 = await callFindOne(
      poolByBand,
      2,
      bandTargetsRank2,
      bandLadderRank2,
      usedKeys,
      usage,
      innerSlotUsage,
    );

    expect(rank1).not.toBeNull();
    expect(rank2).not.toBeNull();
    const nums1 = [rank1!.num1, rank1!.num2, rank1!.num3, rank1!.num4, rank1!.num5, rank1!.num6];
    const nums2 = [rank2!.num1, rank2!.num2, rank2!.num3, rank2!.num4, rank2!.num5, rank2!.num6];
    expect(setKey(nums2)).not.toBe(setKey(nums1));
  });

  it('rank별 band tier로 슬롯마다 서로 다른 조합을 채울 수 있다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const baseTargets = [0, 3, 8, 15, 22, 30];
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();
    const keys: string[] = [];

    for (const rank of COMBO_RANK_SLOT_ORDER.slice(0, 3)) {
      const offset = rank - 1;
      const bandTargets = baseTargets.map((b) => b + offset);
      const bandLadder = bandTargets.map((b, i) => [b, b + 1, b + 2 + i]);
      const one = await callFindOne(
        poolByBand,
        rank,
        bandTargets,
        bandLadder,
        usedKeys,
        usage,
        innerSlotUsage,
      );
      expect(one).not.toBeNull();
      keys.push(
        setKey([one!.num1, one!.num2, one!.num3, one!.num4, one!.num5, one!.num6]),
      );
    }

    expect(new Set(keys).size).toBe(3);
  });

  it('rank19는 tier 19 band ladder로 세트를 만든다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const baseTargets = [0, 3, 8, 15, 22, 30];
    const bandTargets = baseTargets.map((b) => b + 18);
    const bandLadder = bandTargets.map((b, i) => [b, b + 1, b + 2 + i, b + 3]);

    const mk = () => ({
      usage: new Map<number, number>(pool.map((n) => [n, 0])),
      innerSlotUsage: new Map<string, number>(),
      usedKeys: new Set<string>(),
    });

    const ctx19 = mk();
    const rank19 = await callFindOne(
      poolByBand,
      19,
      bandTargets,
      bandLadder,
      ctx19.usedKeys,
      ctx19.usage,
      ctx19.innerSlotUsage,
    );

    expect(rank19).not.toBeNull();
    expect(rank19!.strategy).toBe('combo:rank19');
  });

  it('avoidKeys에 있는 조합은 세트 후보에서 제외한다', async () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 3, 8, 15, 22, 30];
    const bandLadder = bandTargets.map((b, i) => [b, b + 1, b + 2 + i]);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const innerSlotUsage = new Map<string, number>();
    const usedKeys = new Set<string>();

    const first = await callFindOne(
      poolByBand,
      1,
      bandTargets,
      bandLadder,
      usedKeys,
      usage,
      innerSlotUsage,
    );
    expect(first).not.toBeNull();
    const blockedKey = setKey([first!.num1, first!.num2, first!.num3, first!.num4, first!.num5, first!.num6]);

    const nextUsage = new Map<number, number>(pool.map((n) => [n, 0]));
    const nextInnerSlotUsage = new Map<string, number>();
    const nextUsedKeys = new Set<string>();
    const next = await callFindOne(
      poolByBand,
      1,
      bandTargets,
      bandLadder,
      nextUsedKeys,
      nextUsage,
      nextInnerSlotUsage,
      0,
      new Set([blockedKey]),
    );

    expect(next).not.toBeNull();
    const nextKey = setKey([next!.num1, next!.num2, next!.num3, next!.num4, next!.num5, next!.num6]);
    expect(nextKey).not.toBe(blockedKey);
  });
});
