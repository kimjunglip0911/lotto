/** 세트별 당첨 등수 집계를 계산한다 */

import { INITIAL_RANK_COUNTS } from '../constants/home';
import type {
  InputNumber,
  LotterySetViewModel,
  RankCounts,
  SetRanking,
  SimulationStatsResult,
} from '../types/home';
import {
  isCalculableWinningNumbers,
  normalizeWinningNumbers,
  toNullableNumber,
} from './normalize';
import { rankOneSet } from './rankSet';

const createRankCounts = (): RankCounts => ({ ...INITIAL_RANK_COUNTS });

const sortSetRankings = (setRankings: SetRanking[]): void => {
  setRankings.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    return left.setNumber - right.setNumber;
  });
};

export const calculateSimulationStats = (
  sets: LotterySetViewModel[],
  winningNumbers: InputNumber[],
  bonusNumber: InputNumber,
): SimulationStatsResult | null => {
  if (!sets || sets.length === 0) return null;

  const rankCounts = createRankCounts();
  const setRankings: SetRanking[] = [];
  const normalized = normalizeWinningNumbers(winningNumbers);
  const canCalculate = isCalculableWinningNumbers(normalized);

  if (!canCalculate) {
    return { canCalculate, totalSets: sets.length, rankCounts, setRankings };
  }

  const winningSet = new Set<number>(normalized);
  const bonus = toNullableNumber(bonusNumber);
  sets.forEach((setInfo, index) => rankOneSet(setInfo, index, winningSet, bonus, rankCounts, setRankings));
  sortSetRankings(setRankings);

  return { canCalculate, totalSets: sets.length, rankCounts, setRankings };
};
