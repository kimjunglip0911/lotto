import { describe, expect, it } from 'vitest';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { EQUAL_WINDOW } from '../constants/window';
import { buildEqualBuckets } from '../logic/buildBuckets';
import { draw } from './fixtures';

describe('equal window slice', () => {
  it('최근 EQUAL_WINDOW회만 집계에 반영한다', () => {
    const rows = [
      draw(1, [40, 41, 42, 43, 44, 45], 39),
      draw(2, [1, 2, 3, 4, 5, 6], 7),
      draw(3, [1, 2, 3, 4, 5, 6], 7),
      draw(4, [1, 2, 3, 4, 5, 6], 7),
      draw(5, [1, 2, 3, 4, 5, 6], 7),
      draw(6, [1, 2, 3, 4, 5, 6], 7),
      draw(7, [1, 2, 3, 4, 5, 6], 7),
    ];
    const windowRows = sliceLatestStatsHistory(rows, EQUAL_WINDOW);
    const buckets = buildEqualBuckets(windowRows);
    expect(windowRows).toHaveLength(6);
    expect(buckets.zero).toContain(40);
    expect(buckets.threePlus).toContain(1);
  });
});
