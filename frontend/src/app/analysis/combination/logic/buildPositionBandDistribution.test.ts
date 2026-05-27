import { describe, expect, it } from 'vitest';
import {
  NUMBER_BAND_LABELS,
  buildPositionBandDistribution,
  numberToBandIndex,
} from './buildPositionBandDistribution';
import type { WinningNumberRow } from '@/app/analysis/chi-square/types';

describe('numberToBandIndex', () => {
  it('maps 1~45 into nine 5-number bands', () => {
    expect(numberToBandIndex(1)).toBe(0);
    expect(numberToBandIndex(5)).toBe(0);
    expect(numberToBandIndex(6)).toBe(1);
    expect(numberToBandIndex(45)).toBe(8);
    expect(NUMBER_BAND_LABELS[numberToBandIndex(12)]).toBe('11~15');
  });
});

describe('buildPositionBandDistribution', () => {
  it('sums percentages to 100 per position across nine bands', () => {
    const row: WinningNumberRow = {
      drawNo: 1,
      drawDate: '2024-01-01',
      num1: 1,
      num2: 6,
      num3: 11,
      num4: 16,
      num5: 21,
      num6: 26,
      bonus: 31,
    };
    const { totalDraws, rows } = buildPositionBandDistribution([row]);
    expect(totalDraws).toBe(1);
    expect(rows).toHaveLength(9 * 6);
    for (let pos = 1; pos <= 6; pos++) {
      const forPos = rows.filter((r) => r.position === pos);
      expect(forPos).toHaveLength(9);
      const sumPct = forPos.reduce((a, r) => a + r.percentage, 0);
      expect(sumPct).toBeCloseTo(100, 2);
      expect(forPos.filter((r) => r.drawCount === 1)).toHaveLength(1);
    }
  });
});
