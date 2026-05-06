import { describe, expect, it } from 'vitest';
import { ADOPTED_USAGE_NUMBER_COUNT } from '../constants';
import type { ChiSquareResult } from '../types';
import { buildChiSquareResults } from './chiSquare';
import {
  buildChiSquareResultsFromCounts,
  classifyDrawExclusiveBucket,
  isNegativeRelPctBinKey,
  relPctToBinKey,
  runChiSquareRelPctBinWalkForward,
  runChiSquareWalkForward,
  selectNumbersByRelPctBinMergedRanking,
  splitAndSortRelPctBins,
} from './walkForwardStats';

const row = (
  draw: number,
  n1: number,
  n2: number,
  n3: number,
  n4: number,
  n5: number,
  n6: number,
  bonus: number
) => ({
  draw_no: draw,
  num1: n1,
  num2: n2,
  num3: n3,
  num4: n4,
  num5: n5,
  num6: n6,
  bonus_num: bonus,
});

describe('buildChiSquareResultsFromCounts', () => {
  it('buildChiSquareResults와 동일한 O·E·편차', () => {
    const rows = [row(1, 1, 2, 3, 4, 5, 6, 7), row(2, 8, 9, 10, 11, 12, 13, 14)];
    const expectedFull = buildChiSquareResults(rows);
    const counts = Array.from({ length: 45 }, () => 0);
    for (const r of rows) {
      for (const n of [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.bonus_num]) {
        counts[n - 1] += 1;
      }
    }
    const fromCounts = buildChiSquareResultsFromCounts(counts, 2);
    for (let i = 0; i < 45; i++) {
      expect(fromCounts[i].observed).toBe(expectedFull[i].observed);
      expect(fromCounts[i].expected).toBeCloseTo(expectedFull[i].expected, 10);
      expect(fromCounts[i].deviation).toBeCloseTo(expectedFull[i].deviation, 10);
    }
  });
});

describe('classifyDrawExclusiveBucket', () => {
  const mk = (num: number, dev: number, exp: number): ChiSquareResult => ({
    number: num,
    observed: dev + exp,
    expected: exp,
    deviation: dev,
    chiSquare: 0,
    isLowFreq: false,
    isHighFreq: false,
  });

  it('음구간 우선: 한 개라도 [-10,0)이면 neg', () => {
    const map = new Map<number, ChiSquareResult>([
      [1, mk(1, -1, 10)],
      [2, mk(2, 5, 10)],
    ]);
    expect(classifyDrawExclusiveBucket([1, 2], map)).toBe('neg');
  });

  it('음 없고 [0,+10]만 있으면 pos', () => {
    const map = new Map<number, ChiSquareResult>([
      [3, mk(3, 0, 10)],
      [4, mk(4, 10, 10)],
    ]);
    expect(classifyDrawExclusiveBucket([3, 4], map)).toBe('pos');
  });

  it('둘 다 아니면 out', () => {
    const map = new Map<number, ChiSquareResult>([
      [5, mk(5, 50, 10)],
    ]);
    expect(classifyDrawExclusiveBucket([5], map)).toBe('out');
  });
});

describe('relPctToBinKey', () => {
  it('1% 경계·말단 오버플로', () => {
    expect(relPctToBinKey(-101)).toBe('lt_-100');
    expect(relPctToBinKey(-100)).toBe('b_-100');
    expect(relPctToBinKey(-99.1)).toBe('b_-100');
    expect(relPctToBinKey(-0.1)).toBe('b_-1');
    expect(relPctToBinKey(0)).toBe('b_0');
    expect(relPctToBinKey(99.9)).toBe('b_99');
    expect(relPctToBinKey(100)).toBe('ge_100');
  });
});

describe('runChiSquareRelPctBinWalkForward', () => {
  it('분모는 유효 목표 회차 수이고, 반환 구간은 모두 비율 1% 이상이다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 8, 9, 10, 11, 12, 13, 14),
    ];
    const s = runChiSquareRelPctBinWalkForward(rows);
    expect(s.denominator).toBe(1);
    expect(s.bins.length).toBeGreaterThan(0);
    expect(s.bins.every((b) => b.pct >= 1)).toBe(true);
  });

  it('allBins는 1% 필터 전 전 구간(202개 키)이고 bins는 그 부분집합이다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 8, 9, 10, 11, 12, 13, 14),
    ];
    const s = runChiSquareRelPctBinWalkForward(rows);
    expect(s.allBins.length).toBe(202);
    expect(s.bins.length).toBeLessThanOrEqual(s.allBins.length);
    const binKeys = new Set(s.bins.map((b) => b.binKey));
    for (const ab of s.allBins) {
      const inDisplay = binKeys.has(ab.binKey);
      if (ab.pct >= 1) {
        expect(inDisplay).toBe(true);
      }
    }
  });
});

describe('selectNumbersByRelPctBinMergedRanking', () => {
  const mk = (num: number, dev: number, exp: number): ChiSquareResult => ({
    number: num,
    observed: dev + exp,
    expected: exp,
    deviation: dev,
    chiSquare: 0,
    isLowFreq: false,
    isHighFreq: false,
  });

  it('구간 비율이 높은 번호를 먼저 고르고 동일 구간은 번호 오름차순', () => {
    const allBins = [
      { binKey: 'b_0', label: '[0%, 1%)', hits: 0, pct: 20 },
      { binKey: 'b_1', label: '[1%, 2%)', hits: 0, pct: 10 },
    ];
    const a = mk(1, 0, 100);
    const b = mk(2, 0, 100);
    const c = mk(3, 1, 100);
    expect(selectNumbersByRelPctBinMergedRanking([c, b, a], allBins, 2)).toEqual([1, 2]);
    expect(selectNumbersByRelPctBinMergedRanking([c, b, a], allBins, 3)).toEqual([1, 2, 3]);
  });

  it('pct가 같을 때는 통합 구간 순위(binKey 문자열 순)로 구간 간 우선순위를 정한다', () => {
    const allBins = [
      { binKey: 'b_1', label: '', hits: 0, pct: 15 },
      { binKey: 'b_0', label: '', hits: 0, pct: 15 },
    ];
    const inB0 = mk(2, 0, 100);
    const inB1 = mk(1, 1, 100);
    expect(selectNumbersByRelPctBinMergedRanking([inB1, inB0], allBins, 2)).toEqual([2, 1]);
  });

  it('동일 구간(동일 pct) 안에서는 번호 오름차순', () => {
    const allBins = [{ binKey: 'b_0', label: '', hits: 0, pct: 50 }];
    const r10 = mk(10, 0, 100);
    const r3 = mk(3, 0, 100);
    const r7 = mk(7, 0, 100);
    expect(selectNumbersByRelPctBinMergedRanking([r10, r7, r3], allBins, 3)).toEqual([3, 7, 10]);
  });

  it('상대편차 불가(E≤0) 번호는 같은 구간보다 뒤로 간다', () => {
    const allBins = [{ binKey: 'b_0', label: '', hits: 0, pct: 5 }];
    const ok = mk(1, 0, 100);
    const bad = mk(2, 0, 0);
    expect(selectNumbersByRelPctBinMergedRanking([bad, ok], allBins, 1)).toEqual([1]);
  });

  it('워크포워드 allBins와 집계 결과로 ADOPTED_USAGE_NUMBER_COUNT개를 반환한다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 8, 9, 10, 11, 12, 13, 14),
    ];
    const s = runChiSquareRelPctBinWalkForward(rows);
    const counts = Array.from({ length: 45 }, () => 0);
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      counts[n - 1] += 1;
    }
    const results = buildChiSquareResultsFromCounts(counts, 1);
    const picked = selectNumbersByRelPctBinMergedRanking(
      results,
      s.allBins,
      ADOPTED_USAGE_NUMBER_COUNT,
    );
    expect(picked).not.toBeNull();
    expect(picked!.length).toBe(ADOPTED_USAGE_NUMBER_COUNT);
    expect(new Set(picked).size).toBe(ADOPTED_USAGE_NUMBER_COUNT);
  });
});

describe('isNegativeRelPctBinKey', () => {
  it('말단·음의 b_·0 이상은 구분한다', () => {
    expect(isNegativeRelPctBinKey('lt_-100')).toBe(true);
    expect(isNegativeRelPctBinKey('b_-5')).toBe(true);
    expect(isNegativeRelPctBinKey('b_0')).toBe(false);
    expect(isNegativeRelPctBinKey('ge_100')).toBe(false);
  });
});

describe('splitAndSortRelPctBins', () => {
  it('음·양 개수 합이 전체 구간 수와 같고 비율 내림차순이다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 8, 9, 10, 11, 12, 13, 14),
    ];
    const summary = runChiSquareRelPctBinWalkForward(rows);
    const split = splitAndSortRelPctBins(summary);
    expect(split.negBins.length + split.posBins.length).toBe(summary.bins.length);
    for (let i = 1; i < split.negBins.length; i++) {
      expect(split.negBins[i - 1].pct).toBeGreaterThanOrEqual(split.negBins[i].pct);
    }
    for (let i = 1; i < split.posBins.length; i++) {
      expect(split.posBins[i - 1].pct).toBeGreaterThanOrEqual(split.posBins[i].pct);
    }
  });
});

describe('runChiSquareWalkForward', () => {
  it('버킷 비율 합이 100%에 가깝다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 1, 2, 3, 4, 5, 6, 8),
      row(3, 10, 11, 12, 13, 14, 15, 16),
    ];
    const s = runChiSquareWalkForward(rows);
    expect(s.denominator).toBe(2);
    const sum = s.bucketNegPct + s.bucketPosPct + s.bucketOutPct;
    expect(sum).toBeCloseTo(100, 5);
    expect(s.raw.bucketNeg + s.raw.bucketPos + s.raw.bucketOut).toBe(2);
  });
});
