import { describe, expect, it } from 'vitest';
import type { ChiSquareResult } from '../types';
import {
  pickFirstNumbersBySignedDeviationDescending,
  pickFirstNumbersBySignedDeviationOrder,
  selectAdoptedBySignedDeviationSkippingExcluded,
  selectAdoptedBySignedDeviationSkippingExcludedDescending,
} from '../logic/chiSquare';

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

describe('pickFirstNumbersBySignedDeviationOrder', () => {
  it('편차(O−E) 값 오름차순·동률 시 번호 오름차순으로 앞에서 count개', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 3, observed: 10, expected: 10, deviation: 0 }),
      mk({ number: 1, observed: 10, expected: 10.5, deviation: -0.5 }),
      mk({ number: 2, observed: 10, expected: 10.5, deviation: 0.5 }),
      mk({ number: 5, observed: 8, expected: 10, deviation: -2 }),
    ];
    expect(pickFirstNumbersBySignedDeviationOrder(rows, 2)).toEqual([5, 1]);
  });

  it('−30~−26 제외 대상이면 그 번호 4개가 앞쪽에 온다', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 8, observed: 0, expected: 10, deviation: -30 }),
      mk({ number: 7, observed: 0, expected: 10, deviation: -28 }),
      mk({ number: 6, observed: 0, expected: 10, deviation: -27 }),
      mk({ number: 5, observed: 0, expected: 10, deviation: -26 }),
      mk({ number: 4, observed: 0, expected: 10, deviation: -25 }),
      mk({ number: 3, observed: 0, expected: 10, deviation: -24 }),
      mk({ number: 2, observed: 0, expected: 10, deviation: -23 }),
      mk({ number: 1, observed: 0, expected: 10, deviation: -22 }),
    ];
    expect(pickFirstNumbersBySignedDeviationOrder(rows, 4)).toEqual([8, 7, 6, 5]);
  });
});

describe('selectAdoptedBySignedDeviationSkippingExcluded', () => {
  it('빈 배열이면 null', () => {
    expect(selectAdoptedBySignedDeviationSkippingExcluded([])).toBeNull();
  });

  it('exclude를 건너뛰고 편차 오름차순에서 이어서 4개', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 8, observed: 0, expected: 10, deviation: -30 }),
      mk({ number: 7, observed: 0, expected: 10, deviation: -28 }),
      mk({ number: 6, observed: 0, expected: 10, deviation: -27 }),
      mk({ number: 5, observed: 0, expected: 10, deviation: -26 }),
      mk({ number: 4, observed: 0, expected: 10, deviation: -25 }),
      mk({ number: 3, observed: 0, expected: 10, deviation: -24 }),
      mk({ number: 2, observed: 0, expected: 10, deviation: -23 }),
      mk({ number: 1, observed: 0, expected: 10, deviation: -22 }),
    ];
    const exclude = new Set(pickFirstNumbersBySignedDeviationOrder(rows, 4));
    expect([...exclude].sort((a, b) => a - b)).toEqual([5, 6, 7, 8]);
    expect(selectAdoptedBySignedDeviationSkippingExcluded(rows, exclude)).toEqual([1, 2, 3, 4]);
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
    expect(selectAdoptedBySignedDeviationSkippingExcluded(rows)).toEqual([1, 2, 3, 4]);
  });

  it('유일 번호가 4개 미만이면 null', () => {
    const rows: ChiSquareResult[] = [mk({ number: 1, observed: 0 }), mk({ number: 2, observed: 1 })];
    expect(selectAdoptedBySignedDeviationSkippingExcluded(rows)).toBeNull();
  });

  it('exclude 때문에 고를 수 있는 고유 번호가 4개 미만이면 null', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 1, observed: 0 }),
      mk({ number: 2, observed: 1 }),
      mk({ number: 3, observed: 2 }),
    ];
    expect(selectAdoptedBySignedDeviationSkippingExcluded(rows, new Set([1, 2, 3]))).toBeNull();
  });

  it('양수 편차로 건너뛰지 않고 음수 구간을 이어서 고른다', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 1, observed: 110, expected: 10, deviation: 100 }),
      mk({ number: 2, observed: 8, expected: 10, deviation: -2 }),
      mk({ number: 3, observed: 9, expected: 10, deviation: -1 }),
      mk({ number: 4, observed: 10, expected: 10, deviation: 0 }),
      mk({ number: 5, observed: 0, expected: 10, deviation: -50 }),
      mk({ number: 6, observed: 15, expected: 10, deviation: 5 }),
      mk({ number: 7, observed: 16, expected: 10, deviation: 6 }),
      mk({ number: 8, observed: 17, expected: 10, deviation: 7 }),
    ];
    const exclude = new Set<number>([5, 2, 3, 4]);
    expect(selectAdoptedBySignedDeviationSkippingExcluded(rows, exclude)).toEqual([1, 6, 7, 8]);
  });
});

describe('pickFirstNumbersBySignedDeviationDescending', () => {
  it('편차 내림차순·동률 시 번호 오름차순으로 앞에서 count개', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 3, observed: 10, expected: 10, deviation: 0 }),
      mk({ number: 1, observed: 11, expected: 10, deviation: 1 }),
      mk({ number: 2, observed: 12, expected: 10, deviation: 2 }),
      mk({ number: 5, observed: 20, expected: 10, deviation: 10 }),
    ];
    expect(pickFirstNumbersBySignedDeviationDescending(rows, 2)).toEqual([5, 2]);
  });
});

describe('selectAdoptedBySignedDeviationSkippingExcludedDescending', () => {
  it('상위 4개 제외 후 내림차순에서 이어서 4개', () => {
    const rows: ChiSquareResult[] = [
      mk({ number: 1, observed: 0, expected: 10, deviation: 22 }),
      mk({ number: 2, observed: 0, expected: 10, deviation: 23 }),
      mk({ number: 3, observed: 0, expected: 10, deviation: 24 }),
      mk({ number: 4, observed: 0, expected: 10, deviation: 25 }),
      mk({ number: 5, observed: 0, expected: 10, deviation: 26 }),
      mk({ number: 6, observed: 0, expected: 10, deviation: 27 }),
      mk({ number: 7, observed: 0, expected: 10, deviation: 28 }),
      mk({ number: 8, observed: 0, expected: 10, deviation: 30 }),
    ];
    const exclude = new Set(pickFirstNumbersBySignedDeviationDescending(rows, 4));
    expect([...exclude].sort((a, b) => a - b)).toEqual([5, 6, 7, 8]);
    expect(selectAdoptedBySignedDeviationSkippingExcludedDescending(rows, exclude)).toEqual([1, 2, 3, 4]);
  });
});
