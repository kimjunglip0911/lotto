/** API 회차·세트 응답을 화면용 배열로 변환 */

import type { LotterySetData } from '../types/home';

export const toAvailableDraws = (data: unknown): number[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const drawNumbers = data.filter((value): value is number => Number.isInteger(value));
  if (drawNumbers.length === 0) return [];
  return [drawNumbers[0] + 1, ...drawNumbers];
};

export const toLotterySets = (data: unknown): LotterySetData[] =>
  Array.isArray(data) ? (data as LotterySetData[]) : [];
