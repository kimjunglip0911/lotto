import { describe, expect, it } from 'vitest';

import { toSetVm } from '../logic/toSetVm';
import type { LotterySetData } from '../types/home';

const mkData = (overrides: Partial<LotterySetData> = {}): LotterySetData => ({
  num1: 1,
  num2: 2,
  num3: 3,
  num4: 4,
  num5: 5,
  num6: 6,
  ...overrides,
});

describe('toSetVm', () => {
  it('6개 번호를 numbers 배열로 매핑한다', () => {
    expect(toSetVm([mkData()], null)).toEqual([
      {
        id: undefined,
        numbers: [1, 2, 3, 4, 5, 6],
        method: undefined,
        drawNo: 0,
      },
    ]);
  });

  it('draw_no가 있으면 그 값을 drawNo로 쓴다', () => {
    expect(toSetVm([mkData({ draw_no: 1200 })], 999)).toEqual([
      expect.objectContaining({ drawNo: 1200 }),
    ]);
  });

  it('draw_no가 없으면 selectedDraw를 drawNo로 쓴다', () => {
    expect(toSetVm([mkData()], 1100)).toEqual([expect.objectContaining({ drawNo: 1100 })]);
  });

  it('draw_no와 selectedDraw가 모두 없으면 drawNo는 0이다', () => {
    expect(toSetVm([mkData()], null)).toEqual([expect.objectContaining({ drawNo: 0 })]);
  });

  it('표시용 numbers는 오름차순으로 정렬한다', () => {
    expect(
      toSetVm([mkData({ num1: 30, num2: 5, num3: 44, num4: 12, num5: 1, num6: 28 })], null),
    ).toEqual([expect.objectContaining({ numbers: [1, 5, 12, 28, 30, 44] })]);
  });
});
