import type { WinningNumberRow } from '../../types/winRow';
import { buildFinalPickChiSquareWalkForwardContext } from './context';

export type ChiSquareFinalPickSlice = {
  adopted: number[];
  walkForwardExcluded: number[];
  walkForwardExcludedByConditionalPct: number[];
  walkForwardExcludedByOverlapRounds: number[];
};

export const getChiSquareFinalPickSlice = ({
  previousDrawRows,
  selectedMainNumbers,
  excludedByStreakNumbers,
  accumulatedExclusionNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
  excludedByStreakNumbers: number[];
  accumulatedExclusionNumbers: number[];
}): ChiSquareFinalPickSlice => {
  const ctx = buildFinalPickChiSquareWalkForwardContext(previousDrawRows, selectedMainNumbers);
  if (!ctx) {
    return {
      adopted: [],
      walkForwardExcluded: [],
      walkForwardExcludedByConditionalPct: [],
      walkForwardExcludedByOverlapRounds: [],
    };
  }
  const excludedSet = new Set<number>([...excludedByStreakNumbers, ...accumulatedExclusionNumbers]);
  return {
    adopted: ctx.survivors.filter((n) => !excludedSet.has(n)),
    walkForwardExcluded: ctx.walkForwardExcluded,
    walkForwardExcludedByConditionalPct: ctx.walkForwardExcludedSplit.byConditionalPct,
    walkForwardExcludedByOverlapRounds: ctx.walkForwardExcludedSplit.byOverlapRounds,
  };
};

export const getChiSquareAdoptedNumbers = (input: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
  excludedByStreakNumbers: number[];
  accumulatedExclusionNumbers: number[];
}): number[] => getChiSquareFinalPickSlice(input).adopted;
