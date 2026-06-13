import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { STATS_WINDOW_DRAWS } from '@/app/recommend/constants/statsWindow';
import { pickStatsHistory } from '@/app/recommend/logic/generation/pickStatsHistory';

const mkRow = (drawNo: number): WinningNumberRow => ({
  draw_no: drawNo,
  num1: 1,
  num2: 2,
  num3: 3,
  num4: 4,
  num5: 5,
  num6: 6,
  bonus_num: 7,
});

describe('pickStatsHistory', () => {
  it('기준 회차 미만만 남기고 최근 26회로 자른다', () => {
    const rows = Array.from({ length: 40 }, (_, i) => mkRow(i + 1));
    const out = pickStatsHistory(rows, 41, STATS_WINDOW_DRAWS);
    expect(out).toHaveLength(26);
    expect(out[0]?.draw_no).toBe(15);
    expect(out[25]?.draw_no).toBe(40);
  });

  it('이력이 26회 미만이면 있는 만큼 반환한다', () => {
    const rows = Array.from({ length: 10 }, (_, i) => mkRow(i + 1));
    const out = pickStatsHistory(rows, 11, STATS_WINDOW_DRAWS);
    expect(out).toHaveLength(10);
  });
});
