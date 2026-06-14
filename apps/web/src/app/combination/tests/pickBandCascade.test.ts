import { describe, expect, it } from 'vitest';
import {
  bandIndexFromLabel,
  filterAppearedBands,
  pickBandIndexForCascadeRank,
} from '../logic/rankPositionBands';
import type { PositionBandDistributionRow } from '../types';

function row(
  position: number,
  bandLabel: string,
  drawCount: number,
  percentage: number,
): PositionBandDistributionRow {
  return { position, bandLabel, drawCount, percentage };
}

describe('filterAppearedBands', () => {
  it('drawCount 0인 band를 제외한다', () => {
    const sorted = [
      row(1, '3', 5, 50),
      row(1, '1', 0, 0),
      row(1, '2', 3, 30),
    ];
    const appeared = filterAppearedBands(sorted);
    expect(appeared).toHaveLength(2);
    expect(appeared.every((r) => r.drawCount > 0)).toBe(true);
  });
});

describe('pickBandIndexForCascadeRank', () => {
  it('3개월 윈도우만으로 rank를 채운다', () => {
    const w3 = [
      row(1, '10', 5, 50),
      row(1, '20', 3, 30),
      row(1, '30', 2, 20),
      row(1, '1', 0, 0),
    ];
    expect(pickBandIndexForCascadeRank([w3], 0)).toBe(bandIndexFromLabel('10'));
    expect(pickBandIndexForCascadeRank([w3], 1)).toBe(bandIndexFromLabel('20'));
    expect(pickBandIndexForCascadeRank([w3], 2)).toBe(bandIndexFromLabel('30'));
  });

  it('3개월 부족 시 6개월 1등부터 이어서 보충한다', () => {
    const w3 = [
      row(1, '10', 5, 50),
      row(1, '20', 3, 30),
      row(1, '1', 0, 0),
    ];
    const w6 = [
      row(1, '10', 8, 40),
      row(1, '20', 6, 30),
      row(1, '40', 4, 20),
      row(1, '41', 2, 10),
    ];
    // rank 3 (idx 2): 3m has 2 appeared → use 6m idx 0 → band 10
    expect(pickBandIndexForCascadeRank([w3, w6], 2)).toBe(bandIndexFromLabel('10'));
    // rank 4 (idx 3): 3m 2 + 6m idx 1 → band 20
    expect(pickBandIndexForCascadeRank([w3, w6], 3)).toBe(bandIndexFromLabel('20'));
    // rank 5 (idx 4): 3m 2 + 6m idx 2 → band 40
    expect(pickBandIndexForCascadeRank([w3, w6], 4)).toBe(bandIndexFromLabel('40'));
  });

  it('6개월까지 부족하면 1년 윈도우에서 보충한다', () => {
    const w3 = [row(1, '5', 3, 60), row(1, '6', 2, 40)];
    const w6 = [row(1, '5', 5, 50), row(1, '6', 3, 30), row(1, '7', 2, 20)];
    const w12 = [
      row(1, '5', 10, 40),
      row(1, '6', 8, 32),
      row(1, '7', 6, 24),
      row(1, '8', 4, 16),
    ];
    // idx 5: 3m(2) + 6m(3) = 5 → 1y idx 0 → band 5
    expect(pickBandIndexForCascadeRank([w3, w6, w12], 5)).toBe(bandIndexFromLabel('5'));
    // idx 6: offset after 3m+6m = 1 → 1y idx 1 → band 6
    expect(pickBandIndexForCascadeRank([w3, w6, w12], 6)).toBe(bandIndexFromLabel('6'));
  });

  it('모든 윈도우에서 부족하면 최장 윈도우 tail로 보충한다', () => {
    const w3 = [row(1, '1', 1, 100)];
    expect(pickBandIndexForCascadeRank([w3], 1)).toBe(bandIndexFromLabel('1'));
  });
});
