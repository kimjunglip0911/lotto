import {
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from '@/app/analysis/chi-square/constants';
import { deviationToBinKey, type DeviationBinRow } from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';

export const isChiSquareBinExcludedByConditionalPct = (bin: DeviationBinRow): boolean =>
  bin.roundsHit > 0 &&
  bin.roundsMatched * 100 <= CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR * bin.roundsHit;

export const isChiSquareBinExcludedByOverlapRounds = (bin: DeviationBinRow): boolean =>
  bin.roundsMatched <= CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS;

export const isChiSquareNumberExcludedByWalkForwardBin = (bin: DeviationBinRow): boolean =>
  isChiSquareBinExcludedByConditionalPct(bin) || isChiSquareBinExcludedByOverlapRounds(bin);

/** 워크포워드 제외 규칙을 통과한 번호만 번호 오름차순. */
export const getChiSquareWalkForwardSurvivorNumbers = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): number[] => {
  if (chiSquareResults.length === 0 || allBins.length === 0) return [];
  const binByKey = new Map(allBins.map((b) => [b.binKey, b] as const));
  const survivors: number[] = [];
  for (const row of chiSquareResults) {
    const bin = binByKey.get(deviationToBinKey(row.deviation));
    if (!bin || isChiSquareNumberExcludedByWalkForwardBin(bin)) continue;
    survivors.push(row.number);
  }
  return survivors.sort((a, b) => a - b);
};
