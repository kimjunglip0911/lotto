import { describe, expect, it } from 'vitest';
import { buildEqualBuckets } from '../logic/buildBuckets';
import { countWithBonus } from '../logic/countWithBonus';
import { draw } from './fixtures';

describe('countWithBonus', () => {
  it('보너스 번호를 출현 횟수에 포함한다', () => {
    const counts = countWithBonus([draw(1, [1, 2, 3, 4, 5, 6], 7)]);
    expect(counts[6]).toBe(1);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(7);
  });
});

describe('buildEqualBuckets', () => {
  it('빈 이력이면 1–45 모두 0회 버킷에 둔다', () => {
    const buckets = buildEqualBuckets([]);
    expect(buckets.zero).toHaveLength(45);
    expect(buckets.one).toEqual([]);
    expect(buckets.two).toEqual([]);
    expect(buckets.threePlus).toEqual([]);
  });

  it('3회 이상 출현은 threePlus로 합치고 전수·중복 없이 나눈다', () => {
    const rows = [
      draw(1, [1, 2, 3, 4, 5, 6], 7),
      draw(2, [1, 2, 3, 8, 9, 10], 7),
      draw(3, [1, 11, 12, 13, 14, 15], 7),
    ];
    const buckets = buildEqualBuckets(rows);
    expect(buckets.threePlus).toEqual([1, 7]);
    expect(buckets.two).toEqual([2, 3]);
    expect(buckets.one).toContain(4);
    expect(buckets.zero).not.toContain(1);
    const all = [...buckets.zero, ...buckets.one, ...buckets.two, ...buckets.threePlus];
    expect(all.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 45 }, (_, i) => i + 1),
    );
  });
});
