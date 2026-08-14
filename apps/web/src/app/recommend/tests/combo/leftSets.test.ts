import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { generateCombinationBasedSets } from '@/app/recommend/logic/combo';
import { fillLeftGap } from '@/app/recommend/logic/combo/leftGapPick';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import { rerankGapLookup } from '@/app/recommend/logic/gap/keepPoolGaps';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';
import { STATS_BAND_CASCADE_WINDOWS } from '@/lib/statsWindow';

const mk = (
  draw_no: number,
  nums: [number, number, number, number, number, number],
): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

const hist = (): WinningNumberRow[] => {
  const rows: WinningNumberRow[] = [];
  for (let d = 1; d <= 80; d++) {
    const base = ((d * 3) % 40) + 1;
    rows.push(mk(d, [base, base + 1, base + 2, base + 3, base + 4, base + 5]));
  }
  return rows;
};

const numsOf = (set: {
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
}) => [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6];

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  maxGap: rank,
  distance: 0,
});

const leftCtx = (lookup: GapRankLookup): FillCtx => ({
  poolByBand: new Map(),
  zeroPoolByBand: new Map(),
  minSum: 21,
  maxSum: 255,
  targetsByRank: new Map(),
  laddersByRank: new Map(),
  usedKeys: new Set(),
  usage: new Map(),
  innerSlotUsage: new Map(),
  histCounts: [],
  positionRankLookup: new Map(),
  positionDrawCountLookup: new Map(),
  gapRankLookup: new Map(),
  zeroGapRankLookup: new Map(),
  leftGapLookup: lookup,
  leftPoolByBand: new Map(),
  repairYieldEvery: 0,
  profileSlots: [],
  pastWinningKeys: new Set(),
});

describe('leftover 21부터 30세트', () => {
  it(
    '목표 30세트를 만들고 조합은 서로 다르다',
    async () => {
      const rows = hist();
      const win = STATS_BAND_CASCADE_WINDOWS[0]!;
      const band = rows.length <= win ? rows : rows.slice(-win);
      const zeroPool = Array.from({ length: 15 }, (_, i) => i + 31);
      const r = await generateCombinationBasedSets([band], [...FULL_LOTTO_POOL], 81, {
        zeroPool,
      });
      expect(r.sets.length).toBe(TARGET_SET_COUNT);
      expect(new Set(r.sets.map((s) => setKey(numsOf(s)))).size).toBe(r.sets.length);
    },
    120_000,
  );

  it('leftover 8개면 서로 다른 간격 5세트를 만든다', async () => {
    const orig = new Map(
      [11, 17, 23, 29, 35, 41, 12, 18].map((rank, i) => [i + 1, gapRow(i + 1, rank)]),
    );
    const ctx = leftCtx(rerankGapLookup(orig));
    const keys = new Set<string>();
    for (const rank of [21, 22, 23, 24, 25]) {
      const set = await fillLeftGap(ctx, rank, new Set());
      expect(set).not.toBeNull();
      keys.add(setKey(numsOf(set!)));
    }
    expect(keys.size).toBe(5);
  });
});
