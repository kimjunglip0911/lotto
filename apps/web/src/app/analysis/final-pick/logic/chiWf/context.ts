import { buildChiSquareResults } from '@/app/analysis/chi-square/logic/chiSquare';
import { runChiSquareDeviationBinWalkForward } from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { WinningNumberRow } from '../../types/winRow';
import { sortUniqueNumbers } from '../../helpers/sortNums';
import { getChiSquareWalkForwardExcludedSplit } from './split';
import { getChiSquareWalkForwardSurvivorNumbers } from './exclude';
import type { ChiSquareWalkForwardExcludedSplit } from './split';

type FinalPickChiSquareWalkForwardContext = {
  survivors: number[];
  walkForwardExcluded: number[];
  walkForwardExcludedSplit: ChiSquareWalkForwardExcludedSplit;
};

export const buildFinalPickChiSquareWalkForwardContext = (
  previousDrawRows: WinningNumberRow[],
  selectedMainNumbers: number[],
): FinalPickChiSquareWalkForwardContext | null => {
  if (previousDrawRows.length < 2 || selectedMainNumbers.length === 0) return null;
  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const chiSquareResults = buildChiSquareResults(sortedRows);
  const walkForwardSummary = runChiSquareDeviationBinWalkForward(sortedRows, {
    minPastDraws: 1,
    referenceMainNumbers: new Set(selectedMainNumbers),
  });
  const allBins = walkForwardSummary.allBins;
  const walkForwardExcludedSplit = getChiSquareWalkForwardExcludedSplit(chiSquareResults, allBins);
  return {
    survivors: getChiSquareWalkForwardSurvivorNumbers(chiSquareResults, allBins),
    walkForwardExcluded: sortUniqueNumbers([
      ...walkForwardExcludedSplit.byConditionalPct,
      ...walkForwardExcludedSplit.byOverlapRounds,
    ]),
    walkForwardExcludedSplit,
  };
};

export const getChiSquareWalkForwardExcludedNumbersFromPickInput = ({
  previousDrawRows,
  selectedMainNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
}): number[] => {
  const ctx = buildFinalPickChiSquareWalkForwardContext(previousDrawRows, selectedMainNumbers);
  return ctx?.walkForwardExcluded ?? [];
};
