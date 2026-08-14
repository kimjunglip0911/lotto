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
  it('최근 156회 밖 출현은 최대에 넣지 않는다', () => {
    const history = Array.from({ length: 160 }, (_, i) =>
      draw(i + 1, i === 0 ? 7 : 8),
    );
    const seven = buildGapRows(history).find((row) => row.number === 7);
    expect(gapDrawCount(history)).toBe(156);
    expect(seven?.maxGap).toBeNull();
    expect(seven?.currentGap).toBeNull();
  });

  it('최대에 도달한 번호 중 미추첨 기간이 긴 번호가 더 위다', () => {
    const rows = buildGapRows([
      draw(1, 7),
      draw(4, 7),
      draw(1, 8),
      draw(5, 8),
      draw(20, 9),
    ]);
    const seven = rows.find((row) => row.number === 7)!;
    const eight = rows.find((row) => row.number === 8)!;
    expect(seven.maxGap).toBe(seven.currentGap);
    expect(eight.maxGap).toBe(eight.currentGap);
    expect(seven.rank).toBeLessThan(eight.rank);
  });

  it('창 안에서 한 번도 안 나온 번호는 순위 하단이다', () => {
    const rows = buildGapRows([draw(5, 30), draw(1, 7), draw(4, 7)]);
    const one = rows.find((row) => row.number === 1);
    const seven = rows.find((row) => row.number === 7);
    expect(one?.maxGap).toBeNull();
    expect(one?.currentGap).toBeNull();
    expect(one?.rank).toBeGreaterThan(seven?.rank ?? 0);
  });
});
