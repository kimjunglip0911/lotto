import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import { NUMBER_BAND_LABELS } from '../constants/bandLabels';
import { buildPositionBandDistribution } from '../logic/buildPositionBandDistribution';
import { numberToBandIndex } from '../logic/numberToBand';

describe('numberToBandIndex', () => {
  it('maps 1~45 into forty-five 1-number bands', () => {
    expect(numberToBandIndex(1)).toBe(0);
    expect(numberToBandIndex(5)).toBe(4);
    expect(numberToBandIndex(6)).toBe(5);
    expect(numberToBandIndex(45)).toBe(44);
    expect(NUMBER_BAND_LABELS[numberToBandIndex(12)]).toBe('12');
  });
});

describe('buildPositionBandDistribution', () => {
  it('sums percentages to 100 per position across forty-five bands', () => {
    const row: WinningNumberRow = {
      draw_no: 1,
      num1: 1,
      num2: 6,
      num3: 11,
      num4: 16,
      num5: 21,
      num6: 26,
      bonus_num: 31,
    };
    const { totalDraws, rows } = buildPositionBandDistribution([row]);
    expect(totalDraws).toBe(1);
    expect(rows).toHaveLength(45 * 6);
    for (let pos = 1; pos <= 6; pos++) {
      const forPos = rows.filter((r) => r.position === pos);
      expect(forPos).toHaveLength(45);
      const sumPct = forPos.reduce((a, r) => a + r.percentage, 0);
      expect(sumPct).toBeCloseTo(100, 2);
      expect(forPos.filter((r) => r.drawCount === 1)).toHaveLength(1);
    }
  });
});
