import { loadDrawWithHistory, loadFirstDrawWinning } from '../../api';
import type { StreakResult, WinningNumberRow } from '../../types';
import { buildStreakResults } from './streak';

export const parseStDrawNo = (selectedDraw: string): number | null => {
  if (!selectedDraw) return null;
  const drawNo = Number(selectedDraw);
  if (!Number.isInteger(drawNo) || drawNo < 1) return null;
  return drawNo;
};

export type StSearchOk =
  | { kind: 'first'; winning: WinningNumberRow }
  | {
      kind: 'range';
      winning: WinningNumberRow;
      analyzedDrawCount: number;
      streakResults: StreakResult[];
    };

export const loadStreakSearch = async (drawNo: number): Promise<StSearchOk> => {
  if (drawNo === 1) {
    const winning = await loadFirstDrawWinning(drawNo);
    return { kind: 'first', winning };
  }
  const { winning, rows } = await loadDrawWithHistory(drawNo);
  return {
    kind: 'range',
    winning,
    analyzedDrawCount: rows.length,
    streakResults: buildStreakResults(rows, drawNo),
  };
};
