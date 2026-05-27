import type { WinningNumberRow } from './rows';

/** 누적 번호 전략 평가에 쓰는 타입(전략 키, 윈도 지표, 추천·버킷 등). */

/** 본번호 6개 출현 누적 집계로 번호 4개를 고르는 규칙 키 */
export type AccumulatedStrategyKey =
  | 'top4Frequency'
  | 'bottom4Frequency'
  | 'nearestMean4'
  | 'twoHotTwoCold';

/** 전략·윈도별 과거 평가 집계 한 행 */
export type StrategyWindowMetrics = {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  evaluatedRounds: number;
  sumHits: number;
  roundsWithAtLeastOne: number;
  minHits: number;
  worstDrawNo: number | null;
  maxMissStreak: number;
};

export type StrategyTopWindow = {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  atLeastOneRate: number;
  avgHits: number;
  maxMissStreak: number;
};

export type AdaptiveWindowSelectionOptions = {
  poolSize: number;
  pickCount: number;
  minWindowGap?: number;
  minWindowSize?: number;
  maxWindowSize?: number;
};

export type StrategyRecommendation = {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  numbers: number[];
  scoreByNumber: Record<number, number>;
  metrics: {
    atLeastOneRate: number;
    avgHits: number;
    maxMissStreak: number;
  };
};

export type FinalNumberSelection = {
  strategyA: StrategyRecommendation;
  strategyB: StrategyRecommendation;
  commonNumbers: number[];
  finalNumbers: number[];
};

export type EvaluationWindowSweepOptions = {
  minWindowSize?: number;
  maxWindowSize?: number;
};

export type RunAccumulatedStrategyEvaluationParams = {
  allRowsSortedAsc: WinningNumberRow[];
  drawNumbersToEvaluate: number[];
  windowSizes: number[];
  strategyKeys: readonly AccumulatedStrategyKey[];
};

export type AccumulatedEvaluationBucketEntry = {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  evaluatedRounds: number;
  sumHits: number;
  roundsWithAtLeastOne: number;
  minHits: number;
  worstDrawNo: number | null;
  currentMissStreak: number;
  maxMissStreak: number;
};

export type AccumulatedEvaluationBucket = Map<string, AccumulatedEvaluationBucketEntry>;
