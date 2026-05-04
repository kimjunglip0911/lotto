import type { WinningNumberRow } from '../../types';

/** 누적 집계(본번호+보너스)로 번호 4개를 고르는 규칙 키 */
export type AccumulatedStrategyKey =
  | 'top4Frequency'
  | 'bottom4Frequency'
  | 'nearestMean4'
  | 'twoHotTwoCold';

export const ACCUMULATED_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = [
  'top4Frequency',
  'bottom4Frequency',
  'nearestMean4',
  'twoHotTwoCold',
] as const;

/** UI·집중 분석: 평균 근접 + 상위2·하위2 (상·하위 단독 전략 제외) */
export const ACCUMULATED_FOCUS_STRATEGY_KEYS: readonly AccumulatedStrategyKey[] = [
  'nearestMean4',
  'twoHotTwoCold',
] as const;

/** 전략·윈도별 과거 평가 집계 한 행 */
export type StrategyWindowMetrics = {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  evaluatedRounds: number;
  sumHits: number;
  roundsWithAtLeastOne: number;
  /** 평가된 회차들 중 적중 개수 최솟값 */
  minHits: number;
  /** minHits가 나온 회차(동률이면 가장 작은 draw_no) */
  worstDrawNo: number | null;
  /** 연속 미적중(0개 적중) 최대 길이 */
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
  /** draw_no 오름차순 */
  allRowsSortedAsc: WinningNumberRow[];
  /** 평가할 각 회차 D(직전 누적만 사용: draw_no < D) */
  drawNumbersToEvaluate: number[];
  windowSizes: number[];
  strategyKeys: readonly AccumulatedStrategyKey[];
};

/** 누적 평가 집계 버킷 — 앵커를 한 칸씩 올릴 때 `accumulateStrategyEvaluationRounds`로만 갱신한다. */
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
