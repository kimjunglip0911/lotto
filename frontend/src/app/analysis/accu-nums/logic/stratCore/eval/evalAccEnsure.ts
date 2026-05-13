import type {
  AccumulatedEvaluationBucket,
  AccumulatedEvaluationBucketEntry,
  AccumulatedStrategyKey,
} from '../types';

const evaluationAggKey = (s: AccumulatedStrategyKey, w: number) => `${s}\t${w}`;

/** 전략·윈도 키에 해당하는 집계 칸이 없으면 만들고, 있으면 그대로 돌려준다. */

export function getOrCreateEvalBucketEntry(
  bucket: AccumulatedEvaluationBucket,
  strategy: AccumulatedStrategyKey,
  windowSize: number
): AccumulatedEvaluationBucketEntry {
  const k = evaluationAggKey(strategy, windowSize);
  let b = bucket.get(k);
  if (!b) {
    b = {
      strategy,
      windowSize,
      evaluatedRounds: 0,
      sumHits: 0,
      roundsWithAtLeastOne: 0,
      minHits: Number.POSITIVE_INFINITY,
      worstDrawNo: null,
      currentMissStreak: 0,
      maxMissStreak: 0,
    };
    bucket.set(k, b);
  }
  return b;
}
