import { describe, expect, it } from 'vitest';
import { BASELINE } from '../constants';
import type { NumberTrendResult } from '../types';
import { pickTrendRecommendedFour } from './trendPickFour';

const B = BASELINE;

function mk(num: number, emaSlow: number): NumberTrendResult {
  return { number: num, emaFast: emaSlow, emaSlow, phase: 'up_cont' };
}

/** deltaPp = (emaSlow - B) * 100 = target → emaSlow = B + target/100 */
function emaForDeltaPp(deltaPp: number): number {
  return B + deltaPp / 100;
}

describe('pickTrendRecommendedFour', () => {
  it('+2.0~+2.9 구간 후보가 4 초과면 +2.5에 가까운 4개만 고른다', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(2, emaForDeltaPp(2.1)),
      mk(3, emaForDeltaPp(2.5)),
      mk(4, emaForDeltaPp(2.6)),
      mk(5, emaForDeltaPp(2.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    // |d-2.5| 가장 작은 순: 3(0), 2(0.4), 4(0.1), 2와4 중 4가 0.1 — 정렬: 3, 4, 2는 0.4, 1은 0.5, 5는 0.4
    // distances: 1→0.5, 2→0.4, 3→0, 4→0.1, 5→0.4 → order 3,4,2,5 (2 before 5 same 0.4, number 2<5)
    expect([...out!].sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
  });

  it('+2 구간이 4 이하면 +1 구간으로 이어 붙인다', () => {
    const rows: NumberTrendResult[] = [
      mk(10, emaForDeltaPp(2.8)),
      mk(11, emaForDeltaPp(2.9)),
      mk(20, emaForDeltaPp(1.0)),
      mk(21, emaForDeltaPp(1.5)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    expect([...out!].sort((a, b) => a - b)).toEqual([10, 11, 20, 21]);
  });

  it('+2·+1로 부족하면 +3 구간을 쓴다', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(2, emaForDeltaPp(1.9)),
      mk(3, emaForDeltaPp(1.8)),
      mk(4, emaForDeltaPp(3.0)),
      mk(5, emaForDeltaPp(3.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    // tier29: 1 only. tier19: 2,3 by delta order 1.8,1.9 → numbers 3,2. tier39: 4,3.0 first then 5
    expect([...out!].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it('exclude에 있는 번호는 선정에서 제외한다', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.5)),
      mk(2, emaForDeltaPp(2.6)),
      mk(3, emaForDeltaPp(2.7)),
      mk(4, emaForDeltaPp(2.8)),
      mk(5, emaForDeltaPp(2.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set([3]), B);
    expect(out).not.toBeNull();
    expect(out!.includes(3)).toBe(false);
    expect(out!.length).toBe(4);
  });

  it('조건을 만족하는 번호가 4개 미만이면 null', () => {
    const rows: NumberTrendResult[] = [mk(1, emaForDeltaPp(2.5)), mk(2, emaForDeltaPp(1.1))];
    expect(pickTrendRecommendedFour(rows, new Set(), B)).toBeNull();
  });

  it('경계: deltaPp 2.0·2.9는 첫 구간, 1.0·1.9는 둘째, 3.0·3.9는 셋째', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(2, emaForDeltaPp(2.9)),
      mk(3, emaForDeltaPp(1.0)),
      mk(4, emaForDeltaPp(1.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    expect([...out!].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it('음수 deltaPp만 있으면 null', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(-1.0)),
      mk(2, emaForDeltaPp(-2.0)),
      mk(3, emaForDeltaPp(-0.5)),
      mk(4, emaForDeltaPp(0)),
    ];
    expect(pickTrendRecommendedFour(rows, new Set(), B)).toBeNull();
  });
});
