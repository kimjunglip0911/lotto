import type { StreakResult, WinningNumberRow } from '../../types';
import { loadDrawWithHistory, loadFirstDrawWinning } from '../fetch/streakFetch';
import { buildStreakResults } from './streak';

// 조회할 회차 번호만 넣으면, 서버에서 데이터를 받아 연속 출현 표에 쓸 결과까지 만듭니다.
// 1회차는 이전 이력이 없어 당첨번호만 돌려 주고, 그 외는 이전 회차까지 포함해 계산합니다.

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
