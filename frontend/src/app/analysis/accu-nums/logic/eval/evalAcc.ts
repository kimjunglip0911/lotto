import type { WinningNumberRow } from '../../types';
import { buildNumberCounts, toMainNumbersOnly } from '../numCounts';
import { countMainHits, pickFourByStrategy } from '../pick/numPick';
import type { AccumulatedEvaluationBucket, AccumulatedStrategyKey } from '../../types/stratEval';
import { sliceWindowTail, upperBoundDrawNo } from '../window/winSlice';
import { applyPredictedHitsToBucketEntry } from './evalAccRound';
import { getOrCreateEvalBucketEntry } from './evalAccEnsure';

/**
 * `runAccumulatedStrategyEvaluation`Í≥???Ïùº??????Ï∞®(?êÎ?? ?¨Î?¨ ??Ï∞®) Ïß?Í≥?Î•?**Í∏∞Ï°¥ Î≤?Ì?∑????Ì????*.
 * `drawRowByNo`??Ï°∞Ì?? ??????Ï∞®Í∞? ?¨Ì?®??Îè?Î°?Ï∂©Î∂?????Ï? ÎßµÏù¥Î©???Î?§(??Ï≤¥ ?πÏ≤® ??Ïù¥Î∏?Í∂?Ï?•).
 */
export function accumulateStrategyEvaluationRounds(params: {
  allRowsSortedAsc: WinningNumberRow[];
  drawNumbersToEvaluate: number[];
  windowSizes: number[];
  strategyKeys: readonly AccumulatedStrategyKey[];
  drawRowByNo: Map<number, WinningNumberRow>;
  bucket: AccumulatedEvaluationBucket;
}): void {
  const { allRowsSortedAsc, drawNumbersToEvaluate, windowSizes, strategyKeys, drawRowByNo, bucket } = params;

  for (const drawNo of drawNumbersToEvaluate) {
    if (drawNo <= 1) {
      continue;
    }
    const row = drawRowByNo.get(drawNo);
    if (!row) {
      continue;
    }
    const actualMain = toMainNumbersOnly(row);
    const priorEnd = upperBoundDrawNo(allRowsSortedAsc, drawNo);
    const priorSortedAsc = allRowsSortedAsc.slice(0, priorEnd);
    if (priorSortedAsc.length === 0) {
      continue;
    }

    for (const windowSize of windowSizes) {
      const windowRows = sliceWindowTail(priorSortedAsc, windowSize);
      if (windowRows.length === 0) {
        continue;
      }
      const counts = buildNumberCounts(windowRows);

      for (const strategy of strategyKeys) {
        const predicted = pickFourByStrategy(counts, strategy);
        const hits = countMainHits(predicted, actualMain);
        const b = getOrCreateEvalBucketEntry(bucket, strategy, windowSize);
        applyPredictedHitsToBucketEntry(b, hits, drawNo);
      }
    }
  }
}
