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
      expect(r.summaryLines.some((line) => line.includes('8등부터 17등'))).toBe(true);
    },
    120_000,
  );
});
