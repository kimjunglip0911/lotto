/** 한 세트의 당첨 등수를 집계에 반영한다 */

import type { LotterySetViewModel, RankCounts, SetRanking } from '../types/home';
import { getRank } from './rank';

const countMatches = (setNumbers: number[], winningSet: Set<number>): number =>
  setNumbers.reduce((count, number) => count + (winningSet.has(number) ? 1 : 0), 0);

export const rankOneSet = (
  setInfo: LotterySetViewModel,
  index: number,
  winningSet: Set<number>,
  bonus: number | null,
  rankCounts: RankCounts,
  setRankings: SetRanking[],
): void => {
  const setNumbers = setInfo.numbers
    .map((number) => Number.parseInt(String(number), 10))
    .filter((number) => !Number.isNaN(number));
  const matchCount = countMatches(setNumbers, winningSet);
  const isBonusMatched = bonus !== null && setNumbers.includes(bonus);
  const rank = getRank(matchCount, isBonusMatched);
  if (rank) {
    rankCounts[rank] += 1;
    setRankings.push({ setNumber: index + 1, rank });
    return;
  }
  rankCounts.fail += 1;
};
