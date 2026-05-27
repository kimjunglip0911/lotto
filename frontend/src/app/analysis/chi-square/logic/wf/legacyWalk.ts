import { TOTAL_NUMBERS } from '../../constants';
import type { WinningNumberRow } from '../../types';
import {
  pickFirstNumbersBySignedDeviationDescending,
  pickFirstNumbersBySignedDeviationOrder,
  selectAdoptedBySignedDeviationSkippingExcluded,
  selectAdoptedBySignedDeviationSkippingExcludedDescending,
} from '../chiSquare';
import { addRowToCounts, hitsSet, mainSix } from '../rowCounts';
import { buildChiSquareResultsFromCounts } from './buildFromCounts';
import { classifyDrawExclusiveBucket } from './classify';
import type { ChiSquareWalkForwardSummary, RunChiSquareWalkForwardOptions } from './types';

export const runChiSquareWalkForward = (
  sortedRows: WinningNumberRow[],
  options?: RunChiSquareWalkForwardOptions,
): ChiSquareWalkForwardSummary => {
  const minPastDraws = options?.minPastDraws ?? 1;
  const rows = [...sortedRows].sort((a, b) => a.draw_no - b.draw_no);
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);
  let hitLowest4 = 0;
  let hitLowest4SkipNext4 = 0;
  let hitHighest4 = 0;
  let hitHighest4SkipNext4 = 0;
  let bucketNeg = 0;
  let bucketPos = 0;
  let bucketOut = 0;
  let denominator = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i >= minPastDraws) {
      const results = buildChiSquareResultsFromCounts(counts, i);
      const resultsByNumber = new Map(results.map((r) => [r.number, r]));
      const bottom4 = pickFirstNumbersBySignedDeviationOrder(results, 4);
      const excludeLow = new Set(bottom4);
      const nextAfterLow = selectAdoptedBySignedDeviationSkippingExcluded(results, excludeLow);
      const top4 = pickFirstNumbersBySignedDeviationDescending(results, 4);
      const excludeHigh = new Set(top4);
      const nextAfterHigh = selectAdoptedBySignedDeviationSkippingExcludedDescending(results, excludeHigh);
      const m6 = mainSix(rows[i]);
      if (hitsSet(m6, bottom4)) hitLowest4 += 1;
      if (nextAfterLow !== null && hitsSet(m6, nextAfterLow)) hitLowest4SkipNext4 += 1;
      if (hitsSet(m6, top4)) hitHighest4 += 1;
      if (nextAfterHigh !== null && hitsSet(m6, nextAfterHigh)) hitHighest4SkipNext4 += 1;
      const bucket = classifyDrawExclusiveBucket(m6, resultsByNumber);
      if (bucket === 'neg') bucketNeg += 1;
      else if (bucket === 'pos') bucketPos += 1;
      else bucketOut += 1;
      denominator += 1;
    }
    addRowToCounts(rows[i], counts);
  }

  const pct = (hits: number) => (denominator > 0 ? (hits / denominator) * 100 : 0);
  return {
    denominator,
    hitLowest4Pct: pct(hitLowest4),
    hitLowest4SkipNext4Pct: pct(hitLowest4SkipNext4),
    hitHighest4Pct: pct(hitHighest4),
    hitHighest4SkipNext4Pct: pct(hitHighest4SkipNext4),
    bucketNegPct: pct(bucketNeg),
    bucketPosPct: pct(bucketPos),
    bucketOutPct: pct(bucketOut),
    raw: { hitLowest4, hitLowest4SkipNext4, hitHighest4, hitHighest4SkipNext4, bucketNeg, bucketPos, bucketOut },
  };
};
