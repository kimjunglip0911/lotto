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
  it('기준 회차 직전 마지막 출현부터 현재 간격을 계산한다', () => {
    const lookup = buildGapRankLookup(
      [draw(1, [7]), draw(4, [7]), draw(10, [7]), draw(11, [7])],
      11,
    );

    const row = lookup.get(7);
    expect(row?.draws).toEqual([1, 4, 10]);
    expect(row?.avgGap).toBe(5);
    expect(row?.currentGap).toBe(1);
    expect(row?.distance).toBe(4);
  });

  it('평균 간격에 가까운 번호를 더 높은 순위로 둔다', () => {
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

    expect(rows[0]?.number).toBe(8);
    expect(rows.find((row) => row.number === 8)?.rank).toBeLessThan(
      rows.find((row) => row.number === 7)?.rank ?? 99,
    );
  });

  it('연속 출현은 마지막 연속 회차부터 다음 출현까지의 간격으로 본다', () => {
    const row = buildGapRankLookup(
      [draw(10, [12]), draw(11, [12]), draw(12, [12]), draw(20, [12])],
      28,
    ).get(12);

    expect(row?.avgGap).toBe(8);
    expect(row?.currentGap).toBe(8);
    expect(row?.distance).toBe(0);
  });

  it('평균 간격이 없으면 순위 하단으로 밀린다', () => {
    const rows = buildGapRankRows([draw(5, [30]), draw(1, [7]), draw(4, [7])], 6);

    expect(rows.find((row) => row.number === 30)?.avgGap).toBeNull();
    expect(rows.find((row) => row.number === 30)?.rank).toBeGreaterThan(
      rows.find((row) => row.number === 7)?.rank ?? 99,
    );
  });
});
