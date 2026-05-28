import { describe, expect, it } from 'vitest';

import type { LotterySetViewModel, RankCounts, SetRanking } from '../types/home';
import { rankOneSet } from '../logic/rankSet';

const createSet = (numbers: number[]): LotterySetViewModel => ({
  drawNo: 1234,
  numbers,
});

const createCounts = (): RankCounts => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  fail: 0,
});

describe('rankOneSet', () => {
  it('등수가 나오면 해당 등수 카운트와 세트 결과를 반영한다', () => {
    const rankCounts = createCounts();
    const setRanks: SetRanking[] = [];

    rankOneSet(createSet([1, 2, 3, 4, 5, 6]), 0, new Set([1, 2, 3, 4, 5, 6]), 7, rankCounts, setRanks);

    expect(rankCounts[1]).toBe(1);
    expect(rankCounts.fail).toBe(0);
    expect(setRanks).toEqual([{ setNumber: 1, rank: 1 }]);
  });

  it('등수가 없으면 fail 카운트만 증가한다', () => {
    const rankCounts = createCounts();
    const setRanks: SetRanking[] = [];

    rankOneSet(createSet([1, 2, 3, 40, 41, 42]), 1, new Set([4, 5, 6, 7, 8, 9]), 10, rankCounts, setRanks);

    expect(rankCounts.fail).toBe(1);
    expect(setRanks).toEqual([]);
  });

  it('숫자로 읽을 수 없는 값은 제외하고 계산한다', () => {
    const rankCounts = createCounts();
    const setRanks: SetRanking[] = [];

    rankOneSet(
      createSet([1, 2, Number.NaN, Number.NaN, 8, 9]),
      2,
      new Set([1, 2, 3, 4, 5, 6]),
      7,
      rankCounts,
      setRanks,
    );

    expect(rankCounts.fail).toBe(1);
    expect(setRanks).toEqual([]);
  });
});
