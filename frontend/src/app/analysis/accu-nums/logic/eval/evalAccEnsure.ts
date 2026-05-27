import type {
  AccumulatedEvaluationBucket,
  AccumulatedEvaluationBucketEntry,
  AccumulatedStrategyKey,
} from '../../types/stratEval';

const evaluationAggKey = (s: AccumulatedStrategyKey, w: number) => `${s}\t${w}`;

/** ?„ëµÂ·?ˆë„ ?¤ì— ?´ë‹¹?˜ëŠ” ì§‘ê³„ ì¹¸ì´ ?†ìœ¼ë©?ë§Œë“¤ê³? ?ˆìœ¼ë©?ê·¸ë?ë¡??Œë ¤ì¤€?? */

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
