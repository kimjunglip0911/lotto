import type { AccumulatedEvaluationBucketEntry } from '../../types/stratEval';

/** ???�차?�서 ?�온 ?�중 개수�?버킷 ??칸의 ?�적·?�속 미적중·최???�차�?갱신?�다. */

export function applyPredictedHitsToBucketEntry(
  b: AccumulatedEvaluationBucketEntry,
  hits: number,
  drawNo: number
): void {
  b.evaluatedRounds += 1;
  b.sumHits += hits;
  if (hits >= 1) {
    b.roundsWithAtLeastOne += 1;
    b.currentMissStreak = 0;
  } else {
    b.currentMissStreak += 1;
    if (b.currentMissStreak > b.maxMissStreak) {
      b.maxMissStreak = b.currentMissStreak;
    }
  }
  if (hits < b.minHits) {
    b.minHits = hits;
    b.worstDrawNo = drawNo;
  } else if (hits === b.minHits && b.worstDrawNo !== null && drawNo < b.worstDrawNo) {
    b.worstDrawNo = drawNo;
  }
}
