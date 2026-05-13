import type { AccumulatedEvaluationBucket, StrategyWindowMetrics } from '../types';

/** 회차별로 쌓인 내부 버킷을 화면·집계용 `StrategyWindowMetrics` 배열로 바꾼다. */
export function aggregatesFromEvaluationBucket(bucket: AccumulatedEvaluationBucket): StrategyWindowMetrics[] {
  const aggregates: StrategyWindowMetrics[] = [...bucket.values()].map((b) => ({
    strategy: b.strategy,
    windowSize: b.windowSize,
    evaluatedRounds: b.evaluatedRounds,
    sumHits: b.sumHits,
    roundsWithAtLeastOne: b.roundsWithAtLeastOne,
    minHits: b.evaluatedRounds === 0 ? 0 : b.minHits === Number.POSITIVE_INFINITY ? 0 : b.minHits,
    worstDrawNo: b.evaluatedRounds === 0 ? null : b.worstDrawNo,
    maxMissStreak: b.maxMissStreak,
  }));

  aggregates.sort((a, b) => {
    if (a.strategy !== b.strategy) {
      return a.strategy.localeCompare(b.strategy);
    }
    return a.windowSize - b.windowSize;
  });

  return aggregates;
}
