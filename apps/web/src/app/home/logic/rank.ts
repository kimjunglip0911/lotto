/** 로또 등수(1~5등) 판정 */

import type { Rank } from '../types/home';

export const getRank = (matchCount: number, isBonusMatched: boolean): Rank | null => {
  if (matchCount === 6) return 1;
  if (matchCount === 5 && isBonusMatched) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
};
