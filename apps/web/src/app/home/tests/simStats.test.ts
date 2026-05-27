import { describe, expect, it } from 'vitest';

import { calculateSimulationStats } from '../logic/simStats';
import type { LotterySetViewModel } from '../types/home';

const mkSet = (numbers: number[]): LotterySetViewModel => ({
  numbers,
  drawNo: 1000,
});

describe('calculateSimulationStats', () => {
  it('세트가 없으면 null을 반환한다', () => {
    expect(calculateSimulationStats([], [1, 2, 3, 4, 5, 6], 7)).toBeNull();
  });

  it('당첨번호가 미완료면 canCalculate=false', () => {
    const result = calculateSimulationStats([mkSet([1, 2, 3, 4, 5, 6])], ['', 2, 3, 4, 5, 6], 7);
    expect(result?.canCalculate).toBe(false);
    expect(result?.setRankings).toHaveLength(0);
  });

  it('6개 일치 시 1등으로 집계한다', () => {
    const result = calculateSimulationStats(
      [mkSet([1, 2, 3, 4, 5, 6])],
      [1, 2, 3, 4, 5, 6],
      7,
    );
    expect(result?.rankCounts[1]).toBe(1);
    expect(result?.setRankings[0]?.rank).toBe(1);
  });

  it('5개+보너스 일치 시 2등으로 집계한다', () => {
    const result = calculateSimulationStats(
      [mkSet([1, 2, 3, 4, 5, 10])],
      [1, 2, 3, 4, 5, 6],
      10,
    );
    expect(result?.rankCounts[2]).toBe(1);
  });

  it('3개 미만 일치는 낙첨으로 집계한다', () => {
    const result = calculateSimulationStats(
      [mkSet([1, 2, 10, 11, 12, 13])],
      [1, 2, 3, 4, 5, 6],
      7,
    );
    expect(result?.rankCounts.fail).toBe(1);
  });
});
