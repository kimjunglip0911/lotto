import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { poolWithoutNums } from '@/app/recommend/logic/generation/prevDrawExclude';
import { keepPoolGapLookup } from '@/app/recommend/logic/gap/keepPoolGaps';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';
import { generateCombinationBasedSets } from '@/app/recommend/logic/combo';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { STATS_BAND_CASCADE_WINDOWS } from '@/lib/statsWindow';

const mkRow = (
  drawNo: number,
  nums: [number, number, number, number, number, number],
): WinningNumberRow => ({
  draw_no: drawNo,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

const syntheticHistory = (count: number): WinningNumberRow[] =>
  Array.from({ length: count }, (_, i) => {
    const base = (i % 40) + 1;
    return mkRow(i + 1, [
      base,
      ((base + 3) % 45) + 1,
      ((base + 7) % 45) + 1,
      ((base + 11) % 45) + 1,
      ((base + 17) % 45) + 1,
      ((base + 23) % 45) + 1,
    ]);
  });

describe('keepPoolGapLookup', () => {
  it('풀 밖 번호를 lookup에서 제거한다', () => {
    const lookup: GapRankLookup = new Map([
      [1, { number: 1, draws: [], currentGap: 1, avgGap: 1, maxGap: 1, distance: 0, rank: 1 }],
      [2, { number: 2, draws: [], currentGap: 2, avgGap: 1, maxGap: 1, distance: 1, rank: 2 }],
    ]);
    const kept = keepPoolGapLookup(lookup, [2]);
    expect(kept.has(1)).toBe(false);
    expect(kept.has(2)).toBe(true);
  });
});

describe('제외 풀 생성', () => {
  it('제외 번호가 생성된 세트에 포함되지 않는다', async () => {
    const hist = syntheticHistory(80);
    const excluded = [1, 2, 3, 4, 5, 6, 7];
    const pool = poolWithoutNums(excluded, FULL_LOTTO_POOL);
    const bandWindows = STATS_BAND_CASCADE_WINDOWS.map(() => hist);
    const result = await generateCombinationBasedSets(hist, bandWindows, pool, 81);
    const banned = new Set(excluded);
    for (const set of result.sets) {
      for (const n of [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]) {
        expect(banned.has(n)).toBe(false);
      }
    }
  });
});
