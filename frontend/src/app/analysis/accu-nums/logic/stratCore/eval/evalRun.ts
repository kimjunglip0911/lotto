import type {
  AccumulatedEvaluationBucket,
  RunAccumulatedStrategyEvaluationParams,
  StrategyWindowMetrics,
} from '../types';
import { accumulateStrategyEvaluationRounds } from './evalAcc';
import { aggregatesFromEvaluationBucket } from './evalAgg';
import { buildDrawNoToWinningRowMap } from './evalWinMap';

/** 여러 회차에 대해 “직전 누적만으로 4개를 찍었을 때” 본번호 6개와의 적중을 한꺼번에 집계한다. 윈도 집계는 당첨 6개 누적과 같은 방식이다. */
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
