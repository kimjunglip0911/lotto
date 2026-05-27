import type { DeviationBinRow, DeviationBinWalkForwardSummary, SplitSortedDeviationBins } from './types';
import { isNegativeDeviationBinKey } from './devBinKeys';

export const splitAndSortDeviationBins = (
  summary: DeviationBinWalkForwardSummary,
): SplitSortedDeviationBins => {
  const negBins: DeviationBinRow[] = [];
  const posBins: DeviationBinRow[] = [];
  for (const row of summary.bins) {
    if (isNegativeDeviationBinKey(row.binKey)) negBins.push(row);
    else posBins.push(row);
  }
  const byPctDesc = (a: DeviationBinRow, b: DeviationBinRow) =>
    b.pct - a.pct || a.binKey.localeCompare(b.binKey);
  negBins.sort(byPctDesc);
  posBins.sort(byPctDesc);
  return {
    denominator: summary.denominator,
    targetRoundCount: summary.targetRoundCount,
    negBins,
    posBins,
  };
};
