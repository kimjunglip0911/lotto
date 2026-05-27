import type { StrategyWindowMetrics } from '../../types/stratEval';

/** 집계 ??줄에???�한 개라??맞춘 비율?�과 ?�평�?맞춘 개수?��? 뽑는?? */

export function toAtLeastOneRate(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.roundsWithAtLeastOne / a.evaluatedRounds : 0;
}

export function toAvgHits(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
}
