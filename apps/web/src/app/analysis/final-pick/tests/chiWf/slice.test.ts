import { describe, expect, it } from 'vitest';
import { getChiSquareAdoptedNumbers, getChiSquareFinalPickSlice } from '../../logic/chiWf';
import { createTestRows } from '../fixtures/winRow';

describe('getChiSquareFinalPickSlice', () => {
  it('채택과 워크포워드 제외를 한 번에 반환한다', () => {
    const slice = getChiSquareFinalPickSlice({
      previousDrawRows: createTestRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      accumulatedExclusionNumbers: [],
    });
    expect(slice.adopted.length).toBeGreaterThan(0);
    const union = new Set([...slice.walkForwardExcluded, ...slice.adopted]);
    expect(union.size).toBe(45);
  });

  it('워크포워드 잔여 번호에서 누적·제외 집합을 뺀다', () => {
    const base = getChiSquareAdoptedNumbers({
      previousDrawRows: createTestRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [],
      accumulatedExclusionNumbers: [],
    });
    expect(base.length).toBeGreaterThanOrEqual(4);
    const remove = new Set([base[0], base[1], base[2], base[3]] as number[]);
    const result = getChiSquareAdoptedNumbers({
      previousDrawRows: createTestRows(220),
      selectedMainNumbers: [1, 2, 3, 4, 5, 6],
      excludedByStreakNumbers: [base[0] as number, base[1] as number, base[2] as number],
      accumulatedExclusionNumbers: [base[3] as number],
    });
    for (const n of remove) expect(result).not.toContain(n);
    expect(result.length).toBe(base.filter((n) => !remove.has(n)).length);
  });
});
