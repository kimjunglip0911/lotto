/** 선택 회차의 세트·당첨번호 묶음 로드 */

import { loadDrawings } from '../api/recommend/drawings';
import { loadWinningByDraw } from '../api/win/winByDraw';
import { toLotterySets } from './drawList';
import type { LotterySetData, WinningNumbersByDraw } from '../types/home';

export interface DrawBundle {
  sets: LotterySetData[];
  winning: WinningNumbersByDraw | null;
}

export const fetchDrawBundle = async (drawNo: number): Promise<DrawBundle> => {
  const [setsData, winningData] = await Promise.all([
    loadDrawings(drawNo),
    loadWinningByDraw(drawNo),
  ]);
  return {
    sets: setsData != null ? toLotterySets(setsData) : [],
    winning: winningData,
  };
};
