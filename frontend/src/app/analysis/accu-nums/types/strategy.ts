/** 전략 구간 막대 차트와 최종 채택 번호 묶음 타입. */

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
  /** UI·스냅샷 구분용(상·하 × 2년·전체) */
  strategyKey: 'top4TwoYear' | 'bottom4TwoYear' | 'top4Full' | 'bottom4Full';
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
