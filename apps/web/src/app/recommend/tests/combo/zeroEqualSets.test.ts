import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { generateCombinationBasedSets } from '@/app/recommend/logic/combo';
import { STATS_BAND_CASCADE_WINDOWS } from '@/lib/statsWindow';

const mk = (
  draw_no: number,
  nums: [number, number, number, number, number, number],
  bonus_num: number,
): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num,
});

/** 1~30만 등장 → 31~45가 0회 */
const histWithZeros = (): WinningNumberRow[] => {
  const rows: WinningNumberRow[] = [];
  for (let d = 1; d <= 80; d++) {
    const base = ((d * 3) % 25) + 1;
    rows.push(mk(d, [base, base + 1, base + 2, base + 3, base + 4, base + 5], base + 6));
  }
  return rows;
};

describe('RANK18~20 균등 0회 세트', () => {
  it(
    'RANK18~20은 zeroPool 번호만 쓴다',
    async () => {
      const hist = histWithZeros();
      const zeroPool = Array.from({ length: 15 }, (_, i) => i + 31);
      const win = STATS_BAND_CASCADE_WINDOWS[0]!;
      const band = hist.length <= win ? hist : hist.slice(-win);
      const r = await generateCombinationBasedSets(
        [band],
        [...FULL_LOTTO_POOL],
        81,
        { zeroPool },
      );
      const banned = new Set(zeroPool);
      for (const rank of [18, 19, 20]) {
        const set = r.sets.find((s) => s.strategy === `combo:rank${rank}`);
        if (!set) continue;
        for (const n of [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]) {
          expect(banned.has(n)).toBe(true);
        }
      }
    },
    120_000,
  );
});
