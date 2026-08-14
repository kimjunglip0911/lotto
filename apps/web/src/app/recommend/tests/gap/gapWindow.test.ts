import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRankLookup } from '@/app/recommend/logic/gap/gapRank';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import {
  STATS_WINDOW_ONE_YEAR,
  STATS_WINDOW_THREE_YEAR,
} from '@/lib/statsWindow';

const draw = (draw_no: number, bonus_num: number): WinningNumberRow => ({
  draw_no,
  num1: 1,
  num2: 2,
  num3: 3,
  num4: 4,
  num5: 5,
  num6: 6,
  bonus_num,
});

describe('gap window slices', () => {
  it('1년 창과 3년 창의 보너스 출현이 다를 수 있다', () => {
    const rows = Array.from({ length: 160 }, (_, i) =>
      draw(i + 1, i + 1 <= 108 ? 20 : 21),
    );
    const year = sliceLatestStatsHistory(rows, STATS_WINDOW_ONE_YEAR);
    const three = sliceLatestStatsHistory(rows, STATS_WINDOW_THREE_YEAR);
    const yearRow = buildGapRankLookup(year, 161).get(20);
    const threeRow = buildGapRankLookup(three, 161).get(20);

    expect(year).toHaveLength(52);
    expect(three).toHaveLength(156);
    expect(yearRow?.draws ?? []).toEqual([]);
    expect(threeRow?.draws.length).toBeGreaterThan(0);
  });
});
