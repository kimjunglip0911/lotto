/**
 * 누적 번호 전략·윈도 과거 평가(rolling evaluation) 엔트리.
 * 구현은 `stratCore/` 아래 eval·window·pick·rec 폴더에 나뉘어 있다.
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

export { accumulateStrategyEvaluationRounds } from './stratCore/eval/evalAcc';
export {
  aggregatesFromEvaluationBucket,
  buildDrawNoToWinningRowMap,
} from './stratCore/eval/evalBucket';
export { runAccumulatedStrategyEvaluation } from './stratCore/eval/evalRun';

export {
  getDefaultEvaluationWindowSizes,
  sliceWindowTail,
  upperBoundDrawNo,
} from './stratCore/window/winSlice';

export {
  countMainHits,
  pickBottom4ByFrequency,
  pickFourByStrategy,
  pickNearestMean4,
  pickTop4ByFrequency,
  pickTwoHotTwoCold,
} from './stratCore/pick/numPick';

export {
  pickAdaptiveWindowsByStrategy,
  pickTopWindowsByStrategy,
  toAtLeastOneRate,
  toAvgHits,
} from './stratCore/window/winRank';

export {
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
} from './stratCore/rec/stratRec';
