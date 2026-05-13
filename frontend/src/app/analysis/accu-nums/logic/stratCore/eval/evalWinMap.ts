import type { WinningNumberRow } from '../../../types';

/** 당첨 이력(회차 오름차순)에서 회차 번호 → 당첨 행 맵을 만든다. */
export function buildDrawNoToWinningRowMap(allRowsSortedAsc: WinningNumberRow[]): Map<number, WinningNumberRow> {
  const drawRow = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawRow.set(row.draw_no, row);
  }
  return drawRow;
}
