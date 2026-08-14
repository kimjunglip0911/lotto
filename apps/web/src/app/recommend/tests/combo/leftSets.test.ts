import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { generateCombinationBasedSets } from '@/app/recommend/logic/combo';
import { setKey } from '@/app/recommend/logic/combo/toSet';
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

describe('leftover 21부터 30세트', () => {
  it(
    '21부터 25는 1부터 10에 없고 26부터 30은 11부터 20에 없다',
    async () => {
      const rows = hist();
      const win = STATS_BAND_CASCADE_WINDOWS[0]!;
      const band = rows.length <= win ? rows : rows.slice(-win);
      const r = await generateCombinationBasedSets(rows, [band], [...FULL_LOTTO_POOL], 81);
      expect(r.sets.length).toBeLessThanOrEqual(TARGET_SET_COUNT);
      const byRank = (rank: number) => r.sets.find((s) => s.strategy === `combo:rank${rank}`);
      const used10 = new Set(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((rank) => {
          const set = byRank(rank);
          return set ? numsOf(set) : [];
        }),
      );
      const used20 = new Set(
        [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((rank) => {
          const set = byRank(rank);
          return set ? numsOf(set) : [];
        }),
      );
      for (const rank of [21, 22, 23, 24, 25]) {
        const set = byRank(rank);
        if (!set) continue;
        for (const n of numsOf(set)) expect(used10.has(n)).toBe(false);
      }
      for (const rank of [26, 27, 28, 29, 30]) {
        const set = byRank(rank);
        if (!set) continue;
        for (const n of numsOf(set)) expect(used20.has(n)).toBe(false);
      }
      expect(new Set(r.sets.map((s) => setKey(numsOf(s)))).size).toBe(r.sets.length);
    },
    120_000,
  );
});
