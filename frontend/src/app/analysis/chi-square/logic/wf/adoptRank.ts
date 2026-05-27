import { CHI_SQUARE_ADOPTION_BIN_MIN_POOL } from '../../constants';
import type { ChiSquareResult } from '../../types';
import type { DeviationBinRow } from './types';
import { deviationToBinKey } from './devBinKeys';

export const selectNumbersByDeviationBinMergedRanking = (
  results: ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
  take: number,
): readonly number[] | null => {
  if (results.length === 0 || take <= 0) return null;
  const countByBin = new Map<string, number>();
  for (const r of results) {
    const k = deviationToBinKey(r.deviation);
    countByBin.set(k, (countByBin.get(k) ?? 0) + 1);
  }
  const pctByBin = new Map(allBins.map((b) => [b.binKey, b.pct]));
  const mergedBinPriority = new Map<string, number>();
  [...allBins]
    .sort((x, y) => y.pct - x.pct || x.binKey.localeCompare(y.binKey))
    .forEach((row, idx) => mergedBinPriority.set(row.binKey, idx));
  const sorted = [...results].sort((a, b) => {
    const keyA = deviationToBinKey(a.deviation);
    const keyB = deviationToBinKey(b.deviation);
    const pcta = pctByBin.get(keyA) ?? Number.NEGATIVE_INFINITY;
    const pctb = pctByBin.get(keyB) ?? Number.NEGATIVE_INFINITY;
    const na = Math.max(CHI_SQUARE_ADOPTION_BIN_MIN_POOL, countByBin.get(keyA) ?? 0);
    const nb = Math.max(CHI_SQUARE_ADOPTION_BIN_MIN_POOL, countByBin.get(keyB) ?? 0);
    const scoreA = pcta / na;
    const scoreB = pctb / nb;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (pctb !== pcta) return pctb - pcta;
    const priA = mergedBinPriority.get(keyA) ?? Number.MAX_SAFE_INTEGER;
    const priB = mergedBinPriority.get(keyB) ?? Number.MAX_SAFE_INTEGER;
    if (priA !== priB) return priA - priB;
    return a.number - b.number;
  });
  const n = Math.min(take, sorted.length);
  if (n < take) return null;
  return sorted.slice(0, n).map((r) => r.number);
};
