/** 분석 세트 목록을 고정 크기 그룹으로 나눈다 */

import type { LotterySetViewModel } from '../types/home';

export const chunkSets = (sets: LotterySetViewModel[], size: number): LotterySetViewModel[][] => {
  const groups: LotterySetViewModel[][] = [];
  for (let index = 0; index < sets.length; index += size) {
    groups.push(sets.slice(index, index + size));
  }
  return groups;
};
