import { describe, expect, it } from 'vitest';
import {
  eligibleSorted,
  wrapEligibleLadder,
} from '../logic/eligibleBands';
import type { PositionBandDistributionRow } from '../types';
import { bandIndexFromLabel } from '../logic/rankPositionBands';

const row = (
  bandLabel: string,
  percentage: number,
  drawCount = 1,
): PositionBandDistributionRow => ({
  position: 1,
  bandLabel,
  drawCount,
  percentage,
});

describe('eligibleSorted', () => {
  it('1% 이상만 남기고 0.x%는 뺀다', () => {
    const sorted = eligibleSorted(
      [row('1', 50), row('2', 1), row('3', 0.4), row('4', 0)],
      1,
    );
    expect(sorted.map((r) => r.bandLabel)).toEqual(['1', '2']);
  });
});

describe('wrapEligibleLadder', () => {
  it('RANK 1은 1등 번호대부터 시작한다', () => {
    const eligible = eligibleSorted(
      [row('5', 20), row('6', 10), row('7', 5)],
      1,
    );
    expect(wrapEligibleLadder(eligible, 1)[0]).toBe(bandIndexFromLabel('5'));
  });

  it('1% 이상 15개면 RANK 16은 그 자리 1등부터 다시 시작한다', () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      row(String(i + 1), 5 - i * 0.1),
    );
    const eligible = eligibleSorted(rows, 1);
    expect(eligible).toHaveLength(15);
    expect(wrapEligibleLadder(eligible, 16)[0]).toBe(bandIndexFromLabel('1'));
    expect(wrapEligibleLadder(eligible, 17)[0]).toBe(bandIndexFromLabel('2'));
  });

  it('0.4% 번호대는 ladder에 없다', () => {
    const eligible = eligibleSorted([row('1', 80), row('2', 0.4)], 1);
    const ladder = wrapEligibleLadder(eligible, 1);
    expect(ladder).not.toContain(bandIndexFromLabel('2'));
  });
});
