import { describe, expect, it } from 'vitest';
import { getAccumulatedExclusionNumbers } from '../logic/accuAdopt';
import { testWinRow, createTestRows } from './fixtures/winRow';

describe('getAccumulatedExclusionNumbers', () => {
  it('행이 없으면 고유 제외 목록이 비어 있다', () => {
    const r = getAccumulatedExclusionNumbers({ previousDrawRows: [] });
    expect(r.excludedUnique).toEqual([]);
    expect(r.twoYearHighest).toBeNull();
  });

  it('한 회차만 있으면 2년·전체 극값이 동일해 고유 목록이 2개 이하다', () => {
    const rows = [testWinRow(1, [1, 2, 3, 4, 5, 6])];
    const r = getAccumulatedExclusionNumbers({ previousDrawRows: rows });
    expect(r.twoYearHighest).toBe(1);
    expect(r.twoYearLowest).toBe(7);
    expect(r.allTimeHighest).toBe(1);
    expect(r.allTimeLowest).toBe(7);
    expect(r.excludedUnique).toEqual([1, 7]);
  });

  it('긴 샘플에서 네 슬롯을 채우고 고유 번호는 정렬된 배열이다', () => {
    const r = getAccumulatedExclusionNumbers({ previousDrawRows: createTestRows(200) });
    expect(r.excludedUnique.length).toBeGreaterThanOrEqual(1);
    expect(r.excludedUnique.length).toBeLessThanOrEqual(4);
    const sorted = [...r.excludedUnique].sort((a, b) => a - b);
    expect(r.excludedUnique).toEqual(sorted);
  });
});
