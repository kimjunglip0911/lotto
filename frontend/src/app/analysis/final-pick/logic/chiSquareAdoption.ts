import { buildChiSquareResults } from '@/app/analysis/chi-square/logic/chiSquare';
import {
  deviationToBinKey,
  runChiSquareDeviationBinWalkForward,
} from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import type { WinningNumberRow } from '../types';

const CHI_SQUARE_ADOPTION_TARGET = 10;

const buildBinPctMap = (allBins: readonly { binKey: string; pct: number }[]): Map<string, number> =>
  new Map(allBins.map((row) => [row.binKey, row.pct] as const));

/**
 * 음/양 편차 구분 없이, 구간 조건부 확률(%)이 높은 번호를 우선 배치한다.
 * 동점일 때는 번호 오름차순으로 고정해 결과를 결정적으로 만든다.
 */
export const rankChiSquareNumbersByConditionalProbability = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly { binKey: string; pct: number }[],
): number[] => {
  if (chiSquareResults.length === 0 || allBins.length === 0) return [];

  const pctByBin = buildBinPctMap(allBins);

  return [...chiSquareResults]
    .sort((a, b) => {
      const pctA = pctByBin.get(deviationToBinKey(a.deviation)) ?? Number.NEGATIVE_INFINITY;
      const pctB = pctByBin.get(deviationToBinKey(b.deviation)) ?? Number.NEGATIVE_INFINITY;
      if (pctB !== pctA) return pctB - pctA;
      return a.number - b.number;
    })
    .map((row) => row.number);
};

export const getChiSquareAdoptedNumbers = ({
  previousDrawRows,
  selectedMainNumbers,
  excludedByStreakNumbers,
  excludedByTrendNumbers,
  adoptedByAccumulatedNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
  excludedByStreakNumbers: number[];
  excludedByTrendNumbers: number[];
  adoptedByAccumulatedNumbers: number[];
}): number[] => {
  if (previousDrawRows.length < 2 || selectedMainNumbers.length === 0) {
    return [];
  }

  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const chiSquareResults = buildChiSquareResults(sortedRows);
  const walkForwardSummary = runChiSquareDeviationBinWalkForward(sortedRows, {
    minPastDraws: 1,
    referenceMainNumbers: new Set(selectedMainNumbers),
  });

  const rankedNumbers = rankChiSquareNumbersByConditionalProbability(
    chiSquareResults,
    walkForwardSummary.allBins,
  );

  const excludedSet = new Set<number>([
    ...excludedByStreakNumbers,
    ...excludedByTrendNumbers,
    ...adoptedByAccumulatedNumbers,
  ]);

  const adopted: number[] = [];
  for (const number of rankedNumbers) {
    if (adopted.length >= CHI_SQUARE_ADOPTION_TARGET) break;
    if (excludedSet.has(number)) continue;
    if (adopted.includes(number)) continue;
    adopted.push(number);
  }

  return adopted;
};
