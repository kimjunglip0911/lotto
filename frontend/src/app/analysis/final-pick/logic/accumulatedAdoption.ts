import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '@/app/analysis/accumulated-numbers/constants';
import { buildNumberCounts } from '@/app/analysis/accumulated-numbers/logic/numberCounts';
import type { WinningNumberRow } from '../types';

const GROUP_TARGET = 4;

type RankedNumber = {
  number: number;
  score: number;
};

export type AccumulatedAdoptionResult = {
  twoYearNumbers: number[];
  allTimeNumbers: number[];
  finalNumbers: number[];
};

const rankNearestMeanNumbers = (rows: WinningNumberRow[]): number[] => {
  if (rows.length === 0) return [];

  const counts = buildNumberCounts(rows);
  const total = counts.reduce((sum, value) => sum + value, 0);
  const mean = total / 45;

  const ranked: RankedNumber[] = Array.from({ length: 45 }, (_, idx) => {
    const number = idx + 1;
    const count = counts[idx] ?? 0;
    return {
      number,
      score: Math.abs(count - mean),
    };
  }).sort((a, b) => a.score - b.score || a.number - b.number);

  return ranked.map((entry) => entry.number);
};

const pickGroupNumbers = ({
  rankedNumbers,
  targetCount,
  excludedSet,
  alreadyPickedSet,
}: {
  rankedNumbers: number[];
  targetCount: number;
  excludedSet: Set<number>;
  alreadyPickedSet: Set<number>;
}): number[] => {
  const picked: number[] = [];
  for (const n of rankedNumbers) {
    if (picked.length >= targetCount) break;
    if (excludedSet.has(n)) continue;
    if (alreadyPickedSet.has(n)) continue;
    picked.push(n);
    alreadyPickedSet.add(n);
  }
  return picked;
};

export const getAccumulatedAdoptedNumbers = ({
  previousDrawRows,
  excludedByStreakNumbers,
  excludedByTrendNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  excludedByStreakNumbers: number[];
  excludedByTrendNumbers: number[];
}): AccumulatedAdoptionResult => {
  if (previousDrawRows.length === 0) {
    return {
      twoYearNumbers: [],
      allTimeNumbers: [],
      finalNumbers: [],
    };
  }

  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const twoYearRows = sortedRows.slice(-ACCUMULATED_STRATEGY_WINDOW_DRAWS);

  const twoYearRanked = rankNearestMeanNumbers(twoYearRows);
  const allTimeRanked = rankNearestMeanNumbers(sortedRows);
  const excludedSet = new Set([...excludedByStreakNumbers, ...excludedByTrendNumbers]);
  const alreadyPickedSet = new Set<number>();

  const twoYearNumbers = pickGroupNumbers({
    rankedNumbers: twoYearRanked,
    targetCount: GROUP_TARGET,
    excludedSet,
    alreadyPickedSet,
  });

  const allTimeNumbers = pickGroupNumbers({
    rankedNumbers: allTimeRanked,
    targetCount: GROUP_TARGET,
    excludedSet,
    alreadyPickedSet,
  });

  return {
    twoYearNumbers: [...twoYearNumbers].sort((a, b) => a - b),
    allTimeNumbers: [...allTimeNumbers].sort((a, b) => a - b),
    finalNumbers: [...twoYearNumbers, ...allTimeNumbers].sort((a, b) => a - b),
  };
};
