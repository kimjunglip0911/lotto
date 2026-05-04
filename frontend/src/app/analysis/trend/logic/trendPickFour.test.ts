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
  it('+2.0~+3.9 구간 후보가 4 초과면 +3%p에 가까운 4개만 고른다', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(2, emaForDeltaPp(2.1)),
      mk(3, emaForDeltaPp(2.5)),
      mk(4, emaForDeltaPp(2.6)),
      mk(5, emaForDeltaPp(2.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    // |d-3|: 5→0.1, 4→0.4, 3→0.5, 2→0.9, 1→1.0 → 상위 4개 번호 2,3,4,5
    expect([...out!].sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
  });

  it('+2.0~+3.9 후보가 4 초과일 때 |d-3| 타이브레이크가 +2.5 근접과 다른 집합을 낸다', () => {
    const rows: NumberTrendResult[] = [
      mk(10, emaForDeltaPp(2.0)),
      mk(11, emaForDeltaPp(2.3)),
      mk(12, emaForDeltaPp(2.5)),
      mk(13, emaForDeltaPp(2.6)),
      mk(14, emaForDeltaPp(2.7)),
      mk(15, emaForDeltaPp(2.9)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    // |d-3|: 15→0.1, 14→0.3, 13→0.4, 12→0.5, 11→0.7, 10→1.0
    expect([...out!].sort((a, b) => a - b)).toEqual([12, 13, 14, 15]);
  });

  it('+2.0~+3.9가 4 이하면 +0.0~+0.9 구간으로 이어 붙인다', () => {
    const rows: NumberTrendResult[] = [
      mk(10, emaForDeltaPp(2.8)),
      mk(11, emaForDeltaPp(2.9)),
      mk(20, emaForDeltaPp(0.0)),
      mk(21, emaForDeltaPp(0.5)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    expect([...out!].sort((a, b) => a - b)).toEqual([10, 11, 20, 21]);
  });

  it('첫 구간 3개와 둘째 0.0~0.9로 4개를 채운다', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(4, emaForDeltaPp(3.0)),
      mk(5, emaForDeltaPp(3.9)),
      mk(2, emaForDeltaPp(0.2)),
      mk(3, emaForDeltaPp(0.8)),
    ];
    const out = pickTrendRecommendedFour(rows, new Set(), B);
    expect(out).not.toBeNull();
    expect([...out!].sort((a, b) => a - b)).toEqual([1, 2, 4, 5]);
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

  it('경계: deltaPp 2.0·3.9는 첫 구간, 0.0·0.9는 둘째 구간', () => {
    const rows: NumberTrendResult[] = [
      mk(1, emaForDeltaPp(2.0)),
      mk(2, emaForDeltaPp(3.9)),
      mk(3, emaForDeltaPp(0.0)),
      mk(4, emaForDeltaPp(0.9)),
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
