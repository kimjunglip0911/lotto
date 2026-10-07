import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { toWindows } from '../logic/windows';
import type { ComboWinView } from '../types/window';

const row = (drawNo: number, num1: number): WinningNumberRow => ({
  draw_no: drawNo,
  num1,
  num2: 2,
  num3: 3,
  num4: 4,
  num5: 5,
  num6: 6,
  bonus_num: 7,
});

const pos1 = (view: ComboWinView, label: string): number =>
  view.rows.find((r) => r.position === 1 && r.bandLabel === label)?.drawCount ?? -1;

describe('toWindows', () => {
  it('최근 52회·156회·전체로 자른다', () => {
    const winners = Array.from({ length: 200 }, (_, i) => row(i + 1, i + 1 > 148 ? 1 : 2));
    const views = toWindows(winners);
    expect(views.map((v) => v.key)).toEqual(['1y', '3y', 'all']);
    expect(views[0].totalDraws).toBe(52);
    expect(views[1].totalDraws).toBe(156);
    expect(views[2].totalDraws).toBe(200);
    expect(views[0].windowSize).toBe(52);
    expect(views[2].windowSize).toBeNull();
    expect(pos1(views[0], '1')).toBe(52);
    expect(pos1(views[2], '1')).toBe(52);
    expect(views[0].rows).toHaveLength(270);
  });

  it('이력이 없으면 세 구간 모두 빈 집계다', () => {
    const views = toWindows([]);
    expect(views).toHaveLength(3);
    expect(views.every((v) => v.totalDraws === 0 && v.rows.length === 0)).toBe(true);
  });
});
