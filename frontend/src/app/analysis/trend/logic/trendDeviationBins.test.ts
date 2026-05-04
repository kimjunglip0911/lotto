import { describe, expect, it } from 'vitest';

import { K_TREND, TOTAL_NUMBERS } from '../constants';
import type { WinningNumberRow } from '../types';
import { aggregateDeviationBins, MIN_BASELINE } from './trendDeviationBins';
import { buildTrendEma, computeEmpiricalAppearanceRate } from './trend';

const mk = (draw_no: number, nums: [number, number, number, number, number, number]): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

const mainSix = (row: WinningNumberRow): number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

const naiveBinKey = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  const lo = Math.floor(pct / 10) * 10;
  return `mid_${lo}`;
};

describe('aggregateDeviationBins', () => {
  it('증분 결과가 회차별 재계산과 동일한 구간 카운트를 낸다(minDraw 100~105 구간)', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d < 100; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 100; d <= 105; d += 1) {
      rows.push(mk(d, [(d % 45) + 1, 2, 3, 4, 5, 6]));
    }

    const naiveCounts = new Map<string, number>();
    let naiveValid = 0;
    let naiveSkipped = 0;
    for (const row of rows) {
      if (row.draw_no < 100 || row.draw_no > 105) continue;
      const prefix = rows.filter((r) => r.draw_no < row.draw_no);
      const baseline = computeEmpiricalAppearanceRate(prefix);
      if (prefix.length === 0 || baseline < MIN_BASELINE) {
        naiveSkipped += mainSix(row).filter((n) => n >= 1 && n <= TOTAL_NUMBERS).length;
        continue;
      }
      for (const num of mainSix(row)) {
        if (num < 1 || num > TOTAL_NUMBERS) continue;
        const ema = buildTrendEma(prefix, num, K_TREND);
        const pct = ((ema - baseline) / baseline) * 100;
        const key = naiveBinKey(pct);
        naiveCounts.set(key, (naiveCounts.get(key) ?? 0) + 1);
        naiveValid += 1;
      }
    }

    const agg = aggregateDeviationBins(rows, { minDraw: 100, maxDraw: 105 });
    expect(agg.validSampleCount).toBe(naiveValid);
    expect(agg.skippedSampleCount).toBe(naiveSkipped);
    for (const r of agg.rows) {
      expect(r.count).toBe(naiveCounts.get(r.key) ?? 0);
    }
  });

  it('기본 minDraw=1일 때 유효 표본이 있으면 구간 비율 합이 약 100%이다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d < 120; d += 1) {
      rows.push(mk(d, [7, 8, 9, 10, 11, 12]));
    }
    const agg = aggregateDeviationBins(rows);
    expect(agg.validSampleCount).toBeGreaterThan(0);
    const sum = agg.rows.reduce((a, r) => a + r.percent, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it('pct=10 은 10~20% 구간(mid_10)에 속한다', () => {
    expect(naiveBinKey(10)).toBe('mid_10');
    expect(naiveBinKey(9.999)).toBe('mid_0');
  });

  it('첫 회차만 있으면 prefix 없어 표본은 모두 스킵된다', () => {
    const agg = aggregateDeviationBins([mk(1, [1, 2, 3, 4, 5, 6])]);
    expect(agg.validSampleCount).toBe(0);
    expect(agg.skippedSampleCount).toBe(6);
  });
});
