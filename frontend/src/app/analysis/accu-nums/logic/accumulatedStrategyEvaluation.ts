/**
 * 누적 번호 전략·윈도 과거 평가(rolling evaluation) 엔트리.
 * 구현은 `strategyEvaluation/` 하위 모듈에 분리되어 있다.
 */

export type {
  AccumulatedEvaluationBucket,
  AccumulatedEvaluationBucketEntry,
  AccumulatedStrategyKey,
  AdaptiveWindowSelectionOptions,
  EvaluationWindowSweepOptions,
  FinalNumberSelection,
  RunAccumulatedStrategyEvaluationParams,
  StrategyRecommendation,
  StrategyTopWindow,
  StrategyWindowMetrics,
} from './strategyEvaluation/types';

export {
  ACCUMULATED_FOCUS_STRATEGY_KEYS,
  ACCUMULATED_STRATEGY_KEYS,
} from './strategyEvaluation/types';

export {
  accumulateStrategyEvaluationRounds,
  aggregatesFromEvaluationBucket,
  buildDrawNoToWinningRowMap,
  runAccumulatedStrategyEvaluation,
} from './strategyEvaluation/evalRun';

export {
  getDefaultEvaluationWindowSizes,
  sliceWindowTail,
  upperBoundDrawNo,
} from './strategyEvaluation/winSlice';

export {
  countMainHits,
  pickBottom4ByFrequency,
  pickFourByStrategy,
  pickNearestMean4,
  pickTop4ByFrequency,
  pickTwoHotTwoCold,
} from './strategyEvaluation/numPick';

export {
  pickAdaptiveWindowsByStrategy,
  pickTopWindowsByStrategy,
  toAtLeastOneRate,
  toAvgHits,
} from './strategyEvaluation/winRank';

export {
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
} from './strategyEvaluation/stratRec';
