/** 회차 목록 초기 로드 */

import { loadDrawNumbers } from '../api/draw/drawNums';
import { toAvailableDraws } from './drawList';

export const fetchInitialDraws = async (): Promise<number[]> => {
  const data = await loadDrawNumbers();
  if (data == null) return [];
  return toAvailableDraws(data);
};
