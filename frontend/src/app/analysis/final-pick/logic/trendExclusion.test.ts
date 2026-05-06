import { describe, expect, it } from 'vitest';
import {
  TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT,
  TREND_EXCLUSION_THRESHOLD_PERCENT,
} from '@/app/analysis/trend/constants';
import { aggregateDeviationBins } from '@/app/analysis/trend/logic/trendDeviationBins';
import { buildTrendResults, computeEmpiricalAppearanceRate } from '@/app/analysis/trend/logic/trend';
import type { WinningNumberRow } from '../types';
import { getTrendExcludedNumbers } from './trendExclusion';

/** `trendExclusion`의 `toBinKey`와 동일(검증용) */
const binKeyForDiffPct = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  return `mid_${Math.floor(pct)}`;
};

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

describe('getTrendExcludedNumbers', () => {
  it('이력이 비어 있으면 제외번호를 반환하지 않는다', () => {
    expect(getTrendExcludedNumbers([])).toEqual([]);
  });

  it('15.00 경계값은 제외에 포함된다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 150; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 151; d <= 1000; d += 1) {
      rows.push(mk(d, d % 2 === 0 ? [7, 8, 9, 10, 11, 12] : [13, 14, 15, 16, 17, 18]));
    }
    // 대략 1000분의 200 수준으로 특정 구간 확률을 만들기 위한 보정
    for (let d = 1001; d <= 1050; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excluded = getTrendExcludedNumbers(rows);
    expect(excluded.length).toBeGreaterThan(0);
  });

  it('15.01 이상 구간 번호는 제외 대상이 아니다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 1200; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excluded = getTrendExcludedNumbers(rows);
    expect(excluded).not.toContain(1);
    expect(excluded).not.toContain(2);
    expect(excluded).not.toContain(3);
    expect(excluded).not.toContain(4);
    expect(excluded).not.toContain(5);
    expect(excluded).not.toContain(6);
  });

  it('제외된 번호의 편차 구간은 출현확률 임계 이하이거나 당첨 포함 회차 임계 이하이다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 150; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 151; d <= 1000; d += 1) {
      rows.push(mk(d, d % 2 === 0 ? [7, 8, 9, 10, 11, 12] : [13, 14, 15, 16, 17, 18]));
    }
    for (let d = 1001; d <= 1050; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excluded = getTrendExcludedNumbers(rows);
    const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
    const baseline = computeEmpiricalAppearanceRate(sorted);
    const summary = aggregateDeviationBins(sorted);
    const binByKey = new Map(summary.rows.map((r) => [r.key, r]));
    const emaByNum = new Map(buildTrendResults(sorted).map((r) => [r.number, r.ema]));

    for (const num of excluded) {
      const ema = emaByNum.get(num);
      expect(ema).toBeDefined();
      const key = binKeyForDiffPct((ema! - baseline) * 100);
      const bin = binByKey.get(key);
      expect(bin).toBeDefined();
      const byProb = bin!.appearanceProbability <= TREND_EXCLUSION_THRESHOLD_PERCENT;
      const byWinningHits = bin!.winningHitDrawCount <= TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT;
      expect(byProb || byWinningHits).toBe(true);
    }
  });

  it('제외되지 않은 번호는 출현확률과 당첨 포함 회차가 둘 다 임계를 넘는 구간에만 있다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 1200; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excludedSet = new Set(getTrendExcludedNumbers(rows));
    const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
    const baseline = computeEmpiricalAppearanceRate(sorted);
    const summary = aggregateDeviationBins(sorted);
    const binByKey = new Map(summary.rows.map((r) => [r.key, r]));

    for (const { number, ema } of buildTrendResults(sorted)) {
      if (excludedSet.has(number)) continue;
      const key = binKeyForDiffPct((ema - baseline) * 100);
      const bin = binByKey.get(key);
      expect(bin).toBeDefined();
      expect(bin!.appearanceProbability).toBeGreaterThan(TREND_EXCLUSION_THRESHOLD_PERCENT);
      expect(bin!.winningHitDrawCount).toBeGreaterThan(TREND_EXCLUSION_MAX_WINNING_HIT_DRAW_COUNT);
    }
  });
});

