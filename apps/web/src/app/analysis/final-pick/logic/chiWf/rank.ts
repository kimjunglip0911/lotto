import { deviationToBinKey } from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';

const buildBinPctMap = (allBins: readonly { binKey: string; pct: number }[]): Map<string, number> =>
  new Map(allBins.map((row) => [row.binKey, row.pct] as const));

/** 구간 조건부 확률(%) 내림차순·동점 시 번호 오름차순. */
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
