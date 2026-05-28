/** 회차 목록 초기 로드 */

import { loadDrawNumbers } from '../api/draw/drawNums';
import { buildDrawList } from '../logic/buildDrawList';

export const fetchInitialDraws = async (): Promise<number[]> => {
  const drawNumbers = await loadDrawNumbers();
  if (drawNumbers == null) return [];
  return buildDrawList(drawNumbers);
};
