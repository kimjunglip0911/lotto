import { describe, expect, it } from 'vitest';

import { K_TREND, TOTAL_NUMBERS } from '../constants';
import type { WinningNumberRow } from '../types';
import { aggregateDeviationBins, MIN_BASELINE } from './trendDeviationBins';
import { computeEmpiricalAppearanceRate } from './trend';

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
  const lo = Math.floor(pct);
  return `mid_${lo}`;
};

describe('aggregateDeviationBins', () => {
  it('증분 결과가 회차별 재계산과 동일한 회차기준 출현확률 집계를 낸다(minDraw 100~105 구간)', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d < 100; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 100; d <= 105; d += 1) {
      rows.push(mk(d, [(d % 45) + 1, 2, 3, 4, 5, 6]));
    }

    const naiveDrawCounts = new Map<string, number>();
    const naiveWinningHitDrawCounts = new Map<string, number>();
    let naiveValidDraws = 0;
    let naiveSkippedDraws = 0;
    const orderedKeys = ['tail_low', ...Array.from({ length: 200 }, (_, i) => `mid_${-100 + i}`), 'tail_high'];
    for (const key of orderedKeys) {
      naiveDrawCounts.set(key, 0);
      naiveWinningHitDrawCounts.set(key, 0);
    }

    for (const row of rows) {
      if (row.draw_no < 100 || row.draw_no > 105) continue;
      const prefix = rows.filter((r) => r.draw_no < row.draw_no);
      const baseline = computeEmpiricalAppearanceRate(prefix);
      if (prefix.length === 0 || baseline < MIN_BASELINE) {
        naiveSkippedDraws += 1;
        continue;
      }

      naiveValidDraws += 1;
      const presentKeys = new Set<string>();
      const winningHitKeys = new Set<string>();
      const winningSet = new Set(mainSix(row));
      const drawsInPrefix = prefix.length;
      const alpha = K_TREND;

      for (let n = 1; n <= TOTAL_NUMBERS; n += 1) {
        let ema = 0;
        for (let i = 0; i < drawsInPrefix; i += 1) {
          const hit = mainSix(prefix[i]!).includes(n) ? 1 : 0;
          ema = hit * alpha + ema * (1 - alpha);
        }
        const diff = (ema - baseline) * 100;
        const key = naiveBinKey(diff);
        presentKeys.add(key);
        if (winningSet.has(n)) winningHitKeys.add(key);
      }

      for (const key of presentKeys) {
        naiveDrawCounts.set(key, (naiveDrawCounts.get(key) ?? 0) + 1);
      }
      for (const key of winningHitKeys) {
        naiveWinningHitDrawCounts.set(key, (naiveWinningHitDrawCounts.get(key) ?? 0) + 1);
      }
    }

    const agg = aggregateDeviationBins(rows, { minDraw: 100, maxDraw: 105 });
    expect(agg.validDrawCount).toBe(naiveValidDraws);
    expect(agg.skippedDrawCount).toBe(naiveSkippedDraws);
    for (const r of agg.rows) {
      expect(r.drawCount).toBe(naiveDrawCounts.get(r.key) ?? 0);
      expect(r.winningHitDrawCount).toBe(naiveWinningHitDrawCounts.get(r.key) ?? 0);
    }
  });

  it('diff=10 은 10~11 구간(mid_10)에 속한다', () => {
    expect(naiveBinKey(10)).toBe('mid_10');
    expect(naiveBinKey(9.999)).toBe('mid_9');
  });

  it('첫 회차만 있으면 prefix 없어 회차가 스킵된다', () => {
    const agg = aggregateDeviationBins([mk(1, [1, 2, 3, 4, 5, 6])]);
    expect(agg.validDrawCount).toBe(0);
    expect(agg.skippedDrawCount).toBe(1);
  });

  it('요구사항 예시: 구간 출현 1000회 중 당첨 포함 1000회면 출현확률 100%', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 1001; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const agg = aggregateDeviationBins(rows, { minDraw: 2, maxDraw: 1001, kTrend: 1 });
    const mid86 = agg.rows.find((r) => r.key === 'mid_86');
    expect(mid86).toBeDefined();
    expect(mid86!.drawCount).toBe(1000);
    expect(mid86!.winningHitDrawCount).toBe(1000);
    expect(mid86!.appearanceProbability).toBeCloseTo(100, 10);
  });

  it('요구사항 예시: 구간 출현 1000회 중 당첨 포함 100회면 출현확률 10%', () => {
    const rows: WinningNumberRow[] = [];
    rows.push(mk(1, [1, 2, 3, 4, 5, 6]));

    for (let d = 2; d <= 101; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 102; d <= 1001; d += 1) {
      rows.push(mk(d, d % 2 === 0 ? [7, 8, 9, 10, 11, 12] : [13, 14, 15, 16, 17, 18]));
    }

    const agg = aggregateDeviationBins(rows, { minDraw: 2, maxDraw: 1001, kTrend: 1 });
    const mid86 = agg.rows.find((r) => r.key === 'mid_86');
    expect(mid86).toBeDefined();
    expect(mid86!.drawCount).toBe(1000);
    expect(mid86!.winningHitDrawCount).toBe(100);
    expect(mid86!.appearanceProbability).toBeCloseTo(10, 10);
  });
});
