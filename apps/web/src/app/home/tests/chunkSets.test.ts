import { describe, expect, it } from 'vitest';

import { chunkSets } from '../logic/chunkSets';
import type { LotterySetViewModel } from '../types/home';

const mkSet = (id: number): LotterySetViewModel => ({
  id,
  numbers: [1, 2, 3, 4, 5, 6],
  drawNo: 1000,
});

describe('chunkSets', () => {
  it('빈 목록이면 빈 배열을 반환한다', () => {
    expect(chunkSets([], 10)).toEqual([]);
  });

  it('묶음 크기가 0 이하이면 빈 배열을 반환한다', () => {
    expect(chunkSets([mkSet(1)], 0)).toEqual([]);
    expect(chunkSets([mkSet(1)], -1)).toEqual([]);
  });

  it('10세트·size 10이면 묶음 1개다', () => {
    const sets = Array.from({ length: 10 }, (_, i) => mkSet(i + 1));
    const groups = chunkSets(sets, 10);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(10);
  });

  it('25세트·size 10이면 묶음 3개이고 마지막은 5개다', () => {
    const sets = Array.from({ length: 25 }, (_, i) => mkSet(i + 1));
    const groups = chunkSets(sets, 10);
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveLength(10);
    expect(groups[1]).toHaveLength(10);
    expect(groups[2]).toHaveLength(5);
  });
});
