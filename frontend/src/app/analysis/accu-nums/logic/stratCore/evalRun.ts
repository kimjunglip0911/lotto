/**
 * 회차별 rolling 예측 4개 vs 해당 회차 본번호 6개 적중을 집계한다.
 * 윈도 집계 `counts`는 `buildNumberCounts`와 동일하게 본번호 6개 출현 누적이다.
 */

export { aggregatesFromEvaluationBucket, buildDrawNoToWinningRowMap } from './evalBucket';
export { accumulateStrategyEvaluationRounds } from './evalAcc';

import { accumulateStrategyEvaluationRounds } from './evalAcc';
import { aggregatesFromEvaluationBucket, buildDrawNoToWinningRowMap } from './evalBucket';
import type {
  AccumulatedEvaluationBucket,
  RunAccumulatedStrategyEvaluationParams,
  StrategyWindowMetrics,
} from './types';

export function runAccumulatedStrategyEvaluation(
  params: RunAccumulatedStrategyEvaluationParams
): {
  aggregates: StrategyWindowMetrics[];
} {
  const { allRowsSortedAsc, drawNumbersToEvaluate, windowSizes, strategyKeys } = params;

  const drawRowByNo = buildDrawNoToWinningRowMap(allRowsSortedAsc);
  const bucket: AccumulatedEvaluationBucket = new Map();
  accumulateStrategyEvaluationRounds({
    allRowsSortedAsc,
    drawNumbersToEvaluate,
    windowSizes,
    strategyKeys,
    drawRowByNo,
    bucket,
  });

  return { aggregates: aggregatesFromEvaluationBucket(bucket) };
}
