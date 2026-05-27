import {
  buildNumberCounts,
  pickLeastFrequentNumber,
  pickTopNumber,
} from './recommend.helpers';

describe('recommend.helpers', () => {
  it('buildNumberCounts includes bonus numbers', () => {
    const rows = [
      {
        num1: 1,
        num2: 2,
        num3: 3,
        num4: 4,
        num5: 5,
        num6: 6,
        bonus_num: 7,
      },
      {
        num1: 7,
        num2: 8,
        num3: 9,
        num4: 10,
        num5: 11,
        num6: 12,
        bonus_num: 1,
      },
    ];
    const counts = buildNumberCounts(rows);
    expect(counts[0]).toBe(2);
    expect(counts[6]).toBe(2);
    expect(counts[44]).toBe(0);
  });

  it('pickLeastFrequentNumber uses smallest on tie', () => {
    const counts = new Array<number>(45).fill(0);
    counts[4] = 1;
    counts[5] = 1;
    counts[6] = 3;
    const result = pickLeastFrequentNumber(counts);
    expect(result.number).toBe(1);
    expect(result.count).toBe(0);
    expect(result.is_tie).toBe(true);
    expect(result.candidates[0]).toBe(1);
  });

  it('pickTopNumber uses smallest on tie', () => {
    const counts = new Array<number>(45).fill(0);
    counts[2] = 8;
    counts[10] = 8;
    counts[20] = 2;
    const result = pickTopNumber(counts);
    expect(result.number).toBe(3);
    expect(result.count).toBe(8);
    expect(result.is_tie).toBe(true);
    expect(result.candidates).toEqual([3, 11]);
  });
});
