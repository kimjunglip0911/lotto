import { describe, expect, it } from 'vitest';
import {
  buildStreakResults,
  getAverageStreak,
  getMaxStreak,
  getTop5PctThreshold,
} from './streak';

describe('buildStreakResults', () => {
  it('이전 회차 데이터가 없으면 1~45번 모두 lastDrawNo=null, streak=선택회차, isCold=false', () => {
    const results = buildStreakResults([], 10);
    expect(results).toHaveLength(45);
    expect(results[0]).toEqual({ number: 1, lastDrawNo: null, streak: 10, isCold: false });
    expect(results[44]).toEqual({ number: 45, lastDrawNo: null, streak: 10, isCold: false });
  });

  it('빈 결과에 대한 통계 함수는 0을 반환', () => {
    expect(getAverageStreak([])).toBe(0);
    expect(getMaxStreak([])).toBe(0);
    expect(getTop5PctThreshold([])).toBe(0);
  });
});
