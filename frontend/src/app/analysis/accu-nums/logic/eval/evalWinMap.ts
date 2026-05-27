import type { WinningNumberRow } from '../../types';

/** ?�첨 ?�력(?�차 ?�름차순)?�서 ?�차 번호 ???�첨 ??맵을 만든?? */
export function buildDrawNoToWinningRowMap(allRowsSortedAsc: WinningNumberRow[]): Map<number, WinningNumberRow> {
  const drawRow = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawRow.set(row.draw_no, row);
  }
  return drawRow;
}
