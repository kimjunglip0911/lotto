import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRankLookup } from '@/app/recommend/logic/gap/gapRank';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_WINDOW_ALL } from '@/lib/statsWindow';

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
  it('전체 이력이면 초반 출현도 간격에 넣는다', () => {
    const rows = Array.from({ length: 160 }, (_, i) =>
      draw(i + 1, i + 1 <= 4 ? 20 : 21),
    );
    const window = sliceLatestStatsHistory(rows, STATS_WINDOW_ALL);
    const row = buildGapRankLookup(window, 161).get(20);

    expect(window).toHaveLength(160);
    expect(row?.draws.length).toBeGreaterThan(0);
  });
});
