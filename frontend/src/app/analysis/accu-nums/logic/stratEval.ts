/**
 * 누적 번호 전략·윈도 과거 평가(rolling evaluation) 엔트리.
 * 구현은 `stratCore/` 하위 모듈에 분리되어 있다.
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
} from './stratCore/types';

export {
  ACCUMULATED_FOCUS_STRATEGY_KEYS,
  ACCUMULATED_STRATEGY_KEYS,
} from './stratCore/types';

export {
  accumulateStrategyEvaluationRounds,
  aggregatesFromEvaluationBucket,
  buildDrawNoToWinningRowMap,
  runAccumulatedStrategyEvaluation,
} from './stratCore/evalRun';

export {
  getDefaultEvaluationWindowSizes,
  sliceWindowTail,
  upperBoundDrawNo,
} from './stratCore/winSlice';

export {
  countMainHits,
  pickBottom4ByFrequency,
  pickFourByStrategy,
  pickNearestMean4,
  pickTop4ByFrequency,
  pickTwoHotTwoCold,
} from './stratCore/numPick';

export {
  pickAdaptiveWindowsByStrategy,
  pickTopWindowsByStrategy,
  toAtLeastOneRate,
  toAvgHits,
} from './stratCore/winRank';

export {
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
} from './stratCore/stratRec';
