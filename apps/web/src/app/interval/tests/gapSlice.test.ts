import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildGapRows, gapDrawCount } from '../logic/buildGapRows';

const draw = (draw_no: number, num: number): WinningNumberRow => ({
  draw_no,
  num1: num,
  num2: 2,
  num3: 3,
  num4: 4,
  num5: 5,
  num6: 6,
  bonus_num: 45,
});

describe('interval gap window', () => {
  it('최근 52회 밖 출현은 최대에 넣지 않는다', () => {
    const history = Array.from({ length: 60 }, (_, i) =>
      draw(i + 1, i === 0 ? 7 : 8),
    );
    const seven = buildGapRows(history).find((row) => row.number === 7);
    expect(gapDrawCount(history)).toBe(52);
    expect(seven?.maxGap).toBeNull();
    expect(seven?.currentGap).toBeNull();
  });

  it('현재가 최대를 넘긴 번호가 더 위다', () => {
    const rows = buildGapRows([
      draw(1, 7),
      draw(4, 7),
      draw(1, 8),
      draw(5, 8),
      draw(20, 9),
    ]);
    const seven = rows.find((row) => row.number === 7)!;
    const eight = rows.find((row) => row.number === 8)!;
    expect(seven.rank).toBeLessThan(eight.rank);
  });

  it('최대를 못 만들면 순위 하단이다', () => {
    const rows = buildGapRows([draw(5, 30), draw(1, 7), draw(4, 7)]);
    const thirty = rows.find((row) => row.number === 30);
    const seven = rows.find((row) => row.number === 7);
    expect(thirty?.maxGap).toBeNull();
    expect(thirty?.rank).toBeGreaterThan(seven?.rank ?? 0);
  });
});
