import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '../types';
import { buildChiSquareResults } from './chiSquare';
import {
  buildChiSquareResultsFromCounts,
  classifyDrawExclusiveBucket,
  relPctToBinKey,
  runChiSquareRelPct5BinWalkForward,
  runChiSquareWalkForward,
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
  it('5% 경계·말단 오버플로', () => {
    expect(relPctToBinKey(-101)).toBe('lt_-100');
    expect(relPctToBinKey(-100)).toBe('b_-100');
    expect(relPctToBinKey(-95)).toBe('b_-95');
    expect(relPctToBinKey(-0.1)).toBe('b_-5');
    expect(relPctToBinKey(0)).toBe('b_0');
    expect(relPctToBinKey(99.9)).toBe('b_95');
    expect(relPctToBinKey(100)).toBe('ge_100');
  });
});

describe('runChiSquareRelPct5BinWalkForward', () => {
  it('분모와 구간 행 개수가 고정 그리드와 같다', () => {
    const rows = [
      row(1, 1, 2, 3, 4, 5, 6, 7),
      row(2, 8, 9, 10, 11, 12, 13, 14),
    ];
    const s = runChiSquareRelPct5BinWalkForward(rows);
    expect(s.denominator).toBe(1);
    expect(s.bins.length).toBe(42);
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
