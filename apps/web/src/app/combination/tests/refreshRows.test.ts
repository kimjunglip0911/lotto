import { describe, expect, it } from 'vitest';
import { buildPositionBandDistribution } from '../logic/buildPositionBandDistribution';
import { fromBandRows } from '../logic/fromStored';
import { toBandInserts } from '../logic/storedRows';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

const row = (
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
  bonus_num: 7,
});

describe('toBandInserts / fromBandRows', () => {
  it('당첨 2회면 해당 번호대 카운트와 자리 비율 합 100이다', () => {
    const dist = buildPositionBandDistribution([
      row(1, [1, 2, 3, 4, 5, 6]),
      row(2, [1, 8, 9, 10, 11, 12]),
    ]);
    const inserts = toBandInserts(dist.totalDraws, dist.rows);
    expect(dist.totalDraws).toBe(2);
    expect(inserts).toHaveLength(270);
    const pos1n1 = inserts.find((r) => r.position === 1 && r.bandLabel === '1');
    expect(pos1n1?.drawCount).toBe(2);
    const sum = inserts
      .filter((r) => r.position === 1)
      .reduce((a, r) => a + r.percentage, 0);
    expect(sum).toBeCloseTo(100, 2);
  });

  it('이력이 없으면 저장 행이 0개다', () => {
    const dist = buildPositionBandDistribution([]);
    expect(toBandInserts(dist.totalDraws, dist.rows)).toEqual([]);
    expect(fromBandRows([])).toEqual({ totalDraws: 0, rows: [] });
  });

  it('회차 번호를 바꾸면 이전 번호대 카운트가 줄고 새 번호대가 는다', () => {
    const before = buildPositionBandDistribution([row(1, [1, 2, 3, 4, 5, 6])]);
    const after = buildPositionBandDistribution([row(1, [7, 8, 9, 10, 11, 12])]);
    const b1 = toBandInserts(before.totalDraws, before.rows);
    const a1 = toBandInserts(after.totalDraws, after.rows);
    expect(b1.find((r) => r.position === 1 && r.bandLabel === '1')?.drawCount).toBe(1);
    expect(a1.find((r) => r.position === 1 && r.bandLabel === '1')?.drawCount).toBe(0);
    expect(a1.find((r) => r.position === 1 && r.bandLabel === '7')?.drawCount).toBe(1);
  });
});
