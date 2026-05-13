import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import { runAccumulatedStrategySelection } from '../logic/runStratSel';

/** 회차별 고정 패턴(본번호 6 + 보너스) — 스냅샷 회귀용 최소 이력 */
function makeRow(drawNo: number): WinningNumberRow {
  const o = drawNo % 7;
  return {
    draw_no: drawNo,
    num1: 1 + o,
    num2: 8 + o,
    num3: 15 + o,
    num4: 22 + o,
    num5: 29 + o,
    num6: 36 + o,
    bonus_num: 45,
  };
}

describe('runAccumulatedStrategySelection', () => {
  it('matches snapshot for fixed draw history', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 100; d <= 180; d += 1) {
      rows.push(makeRow(d));
    }
    const result = runAccumulatedStrategySelection(rows);
    expect(result).toMatchSnapshot();
  });
});
