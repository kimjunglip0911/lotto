import type { StrategyWindowMetrics } from '../types';

/** 집계 한 줄에서 “한 개라도 맞춘 비율”과 “평균 맞춘 개수”를 뽑는다. */

export function toAtLeastOneRate(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.roundsWithAtLeastOne / a.evaluatedRounds : 0;
}

export function toAvgHits(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
}
