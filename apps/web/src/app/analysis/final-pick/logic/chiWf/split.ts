import { deviationToBinKey, type DeviationBinRow } from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import { sortUniqueNumbers } from '../../helpers/sortNums';
import { isChiSquareBinExcludedByConditionalPct, isChiSquareBinExcludedByOverlapRounds } from './exclude';

export type ChiSquareWalkForwardExcludedSplit = {
  byConditionalPct: number[];
  byOverlapRounds: number[];
};

export const getChiSquareWalkForwardExcludedSplit = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): ChiSquareWalkForwardExcludedSplit => {
  if (chiSquareResults.length === 0 || allBins.length === 0) {
    return { byConditionalPct: [], byOverlapRounds: [] };
  }
  const binByKey = new Map(allBins.map((b) => [b.binKey, b] as const));
  const byConditionalPct: number[] = [];
  const byOverlapRounds: number[] = [];
  for (const row of chiSquareResults) {
    const bin = binByKey.get(deviationToBinKey(row.deviation));
    if (!bin) {
      byOverlapRounds.push(row.number);
      continue;
    }
    if (isChiSquareBinExcludedByConditionalPct(bin)) byConditionalPct.push(row.number);
    if (isChiSquareBinExcludedByOverlapRounds(bin)) byOverlapRounds.push(row.number);
  }
  return {
    byConditionalPct: sortUniqueNumbers(byConditionalPct),
    byOverlapRounds: sortUniqueNumbers(byOverlapRounds),
  };
};

export const getChiSquareWalkForwardExcludedNumbers = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): number[] => {
  const split = getChiSquareWalkForwardExcludedSplit(chiSquareResults, allBins);
  return sortUniqueNumbers([...split.byConditionalPct, ...split.byOverlapRounds]);
};
