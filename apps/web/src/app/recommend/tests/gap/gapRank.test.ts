import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRankLookup, buildGapRankRows } from '@/app/recommend/logic/gap/gapRank';

const draw = (draw_no: number, nums: number[]): WinningNumberRow => ({
  draw_no,
  num1: nums[0] ?? 1,
  num2: nums[1] ?? 2,
  num3: nums[2] ?? 3,
  num4: nums[3] ?? 4,
  num5: nums[4] ?? 5,
  num6: nums[5] ?? 6,
  bonus_num: 45,
});

describe('buildGapRankRows', () => {
  it('현재·최대 간격과 거리를 계산한다', () => {
    const row = buildGapRankLookup(
      [draw(1, [7]), draw(4, [7]), draw(10, [7]), draw(11, [7])],
      11,
    ).get(7);

    expect(row?.draws).toEqual([1, 4, 10]);
    expect(row?.maxGap).toBe(6);
    expect(row?.currentGap).toBe(1);
    expect(row?.distance).toBe(5);
  });

  it('최대 간격에 가까운 번호를 더 높은 순위로 둔다', () => {
    const rows = buildGapRankRows(
      [
        draw(1, [7]),
        draw(4, [7]),
        draw(10, [7]),
        draw(3, [8]),
        draw(6, [8]),
        draw(9, [8]),
      ],
      12,
    );

    expect(rows.find((row) => row.number === 8)?.rank).toBeLessThan(
      rows.find((row) => row.number === 7)?.rank ?? 99,
    );
  });

  it('현재가 더 길면 최대를 그 값으로 갱신한다', () => {
    const row = buildGapRankLookup([draw(1, [7]), draw(4, [7])], 20).get(7);
    expect(row?.currentGap).toBe(16);
    expect(row?.maxGap).toBe(16);
    expect(row?.distance).toBe(0);
  });

  it('최대에 도달한 번호 중 미추첨 기간이 긴 번호를 더 위에 둔다', () => {
    const rows = buildGapRankRows(
      [draw(1, [7]), draw(4, [7]), draw(1, [8]), draw(5, [8])],
      20,
    );
    const seven = rows.find((row) => row.number === 7)!;
    const eight = rows.find((row) => row.number === 8)!;
    expect(seven.maxGap).toBe(16);
    expect(eight.maxGap).toBe(15);
    expect(seven.rank).toBeLessThan(eight.rank);
  });

  it('창 안에서 한 번도 안 나온 번호는 순위 하단으로 밀린다', () => {
    const rows = buildGapRankRows([draw(5, [30]), draw(1, [7]), draw(4, [7])], 6);

    expect(rows.find((row) => row.number === 1)?.maxGap).toBeNull();
    expect(rows.find((row) => row.number === 1)?.rank).toBeGreaterThan(
      rows.find((row) => row.number === 7)?.rank ?? 99,
    );
  });

  it('보너스 번호 출현도 간격 집계에 포함한다', () => {
    const rows: WinningNumberRow[] = [
      { ...draw(1, [1, 2, 3, 4, 5, 6]), bonus_num: 20 },
      { ...draw(5, [1, 2, 3, 4, 5, 6]), bonus_num: 20 },
      { ...draw(9, [1, 2, 3, 4, 5, 6]), bonus_num: 21 },
    ];
    const row = buildGapRankLookup(rows, 12).get(20);
    expect(row?.draws).toEqual([1, 5]);
    expect(row?.maxGap).toBe(7);
    expect(row?.currentGap).toBe(7);
  });
});
