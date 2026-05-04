import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '../types';
import { selectAdoptedNumbersByLowObserved } from './chiSquare';

function mk(partial: Pick<ChiSquareResult, 'number' | 'observed'> & Partial<ChiSquareResult>): ChiSquareResult {
  const expected = partial.expected ?? 10;
  const observed = partial.observed;
  const deviation = partial.deviation ?? observed - expected;
  const chiSquare = partial.chiSquare ?? 0;
  return {
    number: partial.number,
    observed,
    expected,
    deviation,
    chiSquare,
    isLowFreq: partial.isLowFreq ?? false,
    isHighFreq: partial.isHighFreq ?? false,
  };
}

describe('selectAdoptedNumbersByLowObserved', () => {
  it('빈 배열이면 null', () => {
    expect(selectAdoptedNumbersByLowObserved([])).toBeNull();
  });

  it('출현 횟수가 가장 적은 순으로 4개(동률 시 번호 오름차순), 반환은 오름차순', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 5, observed: 2 }),
      mk({ number: 1, observed: 0 }),
      mk({ number: 3, observed: 1 }),
      mk({ number: 2, observed: 0 }),
      mk({ number: 4, observed: 1 }),
    ];
    expect(selectAdoptedNumbersByLowObserved(rows)).toEqual([1, 2, 3, 4]);
  });

  it('동일 번호가 중복 행으로 들어오면 스킵하고 다음 순위로 4개를 채운다', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 1, observed: 0 }),
      mk({ number: 1, observed: 0 }),
      mk({ number: 2, observed: 0 }),
      mk({ number: 3, observed: 0 }),
      mk({ number: 4, observed: 0 }),
      mk({ number: 5, observed: 1 }),
    ];
    expect(selectAdoptedNumbersByLowObserved(rows)).toEqual([1, 2, 3, 4]);
  });

  it('유일 번호가 4개 미만이면 null', () => {
    const rows: ChiSquareResult[] = [mk({ number: 1, observed: 0 }), mk({ number: 2, observed: 1 })];
    expect(selectAdoptedNumbersByLowObserved(rows)).toBeNull();
  });
});
