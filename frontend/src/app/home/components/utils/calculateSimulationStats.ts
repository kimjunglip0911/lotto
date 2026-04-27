import type { InputNumber, LotterySetViewModel } from '@/app/home/components/types';

type Rank = 1 | 2 | 3 | 4 | 5;

const INITIAL_RANK_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 } as const;

export interface SetRanking {
  setNumber: number;
  rank: Rank;
}

export interface RankCounts {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  fail: number;
}

export interface SimulationStatsResult {
  canCalculate: boolean;
  totalSets: number;
  rankCounts: RankCounts;
  setRankings: SetRanking[];
}

function toNullableNumber(value: InputNumber): number | null {
  const parsedValue = Number.parseInt(String(value), 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function normalizeWinningNumbers(winningNumbers: InputNumber[]): number[] {
  return winningNumbers
    .map(toNullableNumber)
    .filter((number): number is number => number !== null);
}

function isCalculableWinningNumbers(winningNumbers: number[]): boolean {
  return winningNumbers.length === 6 && !winningNumbers.some((number) => number === 0);
}

function getRank(matchCount: number, isBonusMatched: boolean): Rank | null {
  if (matchCount === 6) return 1;
  if (matchCount === 5 && isBonusMatched) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

function createRankCounts(): RankCounts {
  return { ...INITIAL_RANK_COUNTS };
}

function sortSetRankings(setRankings: SetRanking[]): void {
  setRankings.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    return left.setNumber - right.setNumber;
  });
}

export const calculateSimulationStats = (
  sets: LotterySetViewModel[],
  winningNumbers: InputNumber[],
  bonusNumber: InputNumber,
): SimulationStatsResult | null => {
  if (!sets || sets.length === 0) return null;

  const rankCounts = createRankCounts();
  const setRankings: SetRanking[] = [];
  const normalizedWinningNumbers = normalizeWinningNumbers(winningNumbers);
  const canCalculate = isCalculableWinningNumbers(normalizedWinningNumbers);

  if (!canCalculate) {
    return {
      canCalculate,
      totalSets: sets.length,
      rankCounts,
      setRankings,
    };
  }

  const winningNumbersSet = new Set<number>(normalizedWinningNumbers);
  const normalizedBonusNumber = toNullableNumber(bonusNumber);

  sets.forEach((setInfo, index) => {
    const normalizedSetNumbers = setInfo.numbers
      .map((number) => Number.parseInt(String(number), 10))
      .filter((number) => !Number.isNaN(number));

    let matchCount = 0;
    normalizedSetNumbers.forEach((number) => {
      if (winningNumbersSet.has(number)) {
        matchCount += 1;
      }
    });

    const isBonusMatched =
      normalizedBonusNumber !== null && normalizedSetNumbers.includes(normalizedBonusNumber);
    const rank = getRank(matchCount, isBonusMatched);

    if (rank) {
      rankCounts[rank] += 1;
      setRankings.push({
        setNumber: index + 1,
        rank,
      });
      return;
    }

    rankCounts.fail += 1;
  });

  sortSetRankings(setRankings);

  return {
    canCalculate,
    totalSets: sets.length,
    rankCounts,
    setRankings,
  };
};
