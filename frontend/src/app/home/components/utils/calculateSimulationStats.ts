interface LotterySet {
  numbers: number[];
}
type InputNumber = number | '';

interface SetRanking {
  setNumber: number;
  rank: number;
}

interface SimulationStatsResult {
  canCalculate: boolean;
  totalSets: number;
  rankCounts: { 1: number; 2: number; 3: number; 4: number; 5: number; fail: number };
  setRankings: SetRanking[];
}

export const calculateSimulationStats = (
  sets: LotterySet[],
  winningNumbers: InputNumber[],
  bonusNumber: InputNumber,
): SimulationStatsResult | null => {
  if (!sets || sets.length === 0) return null;

  const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 };
  const setRankings: SetRanking[] = [];

  const winNums = winningNumbers.map((number) => Number.parseInt(String(number), 10)).filter((number) => !Number.isNaN(number));
  const winBonus = Number.parseInt(String(bonusNumber), 10);
  const canCalculate = winNums.length === 6 && !winNums.some((number) => number === 0);

  sets.forEach((setInfo, index) => {
    if (!canCalculate) return;

    const setNumbers = setInfo.numbers.map((number) => Number.parseInt(String(number), 10));
    const matchCount = setNumbers.filter((number) => winNums.includes(number)).length;
    const isBonusMatched = setNumbers.includes(winBonus);

    let rank = 0;
    if (matchCount === 6) rank = 1;
    else if (matchCount === 5 && isBonusMatched) rank = 2;
    else if (matchCount === 5) rank = 3;
    else if (matchCount === 4) rank = 4;
    else if (matchCount === 3) rank = 5;

    if (rank > 0) {
      rankCounts[rank as keyof typeof rankCounts]++;
      setRankings.push({
        setNumber: index + 1,
        rank,
      });
    } else {
      rankCounts.fail++;
    }
  });

  const totalSets = sets.length;
  setRankings.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.setNumber - b.setNumber;
  });

  return {
    canCalculate,
    totalSets,
    rankCounts,
    setRankings,
  };
};
