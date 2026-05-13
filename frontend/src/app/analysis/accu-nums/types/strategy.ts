/** 평균근접 전략 차트와 최종 채택 번호 묶음 타입. */
export type StrategyChartData = {
  key: string;
  title: string;
  counts: number[];
  analyzedDrawCount: number;
  noDataMessage: string;
  strategyLabel: string;
  windowSize: number;
  atLeastOneRate: number;
  avgHits: number;
  maxMissStreak: number;
};

export type StrategyNumberPick = {
  /** UI·스냅샷 구분용(평균근접 2년 vs 전체는 서로 다른 키) */
  strategyKey: 'nearestMean4TwoYear' | 'nearestMean4Full' | 'twoHotTwoCold';
  strategyLabel: string;
  windowSizes: number[];
  numbers: number[];
  atLeastOneRate: number;
  avgHits: number;
  maxMissStreak: number;
};

export type FinalNumberPlan = {
  commonNumbers: number[];
  finalNumbers: number[];
  strategyPicks: StrategyNumberPick[];
};
