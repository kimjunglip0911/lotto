/** API 회차·세트 응답을 화면용 배열로 변환 */

import type { LotterySetData } from '../types/home';

export const toAvailableDraws = (data: number[]): number[] => {
  if (data.length === 0) return [];
  return [data[0] + 1, ...data];
};

export const toLotterySets = (data: unknown): LotterySetData[] =>
  Array.isArray(data) ? (data as LotterySetData[]) : [];
