import type { AccumulatedEvaluationBucketEntry } from '../types';

/** 한 회차에서 나온 적중 개수로 버킷 한 칸의 누적·연속 미적중·최악 회차를 갱신한다. */

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
