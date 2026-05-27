import type { AccumulatedStrategyKey } from '../../types/stratEval';
import { sortByCountAscThenNumberAsc, sortByCountDescThenNumberAsc } from './numPickSort';
import { pickNearestMean4, pickTwoHotTwoCold } from './numPickAlt';

/** ?? ?? ?? 4? ??. */
export const pickTop4ByFrequency = (counts: number[]): number[] =>
  sortByCountDescThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);

/** ?? ?? ?? 4? ??. */
export const pickBottom4ByFrequency = (counts: number[]): number[] =>
  sortByCountAscThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);

export const pickFourByStrategy = (counts: number[], strategy: AccumulatedStrategyKey): number[] => {
  switch (strategy) {
    case 'top4Frequency':
      return pickTop4ByFrequency(counts);
    case 'bottom4Frequency':
      return pickBottom4ByFrequency(counts);
    case 'nearestMean4':
      return pickNearestMean4(counts);
    case 'twoHotTwoCold':
      return pickTwoHotTwoCold(counts);
  }
};

export const countMainHits = (predictedFour: number[], actualMainSix: number[]): number => {
  const actual = new Set(actualMainSix);
  return predictedFour.reduce((acc, n) => acc + (actual.has(n) ? 1 : 0), 0);
};
