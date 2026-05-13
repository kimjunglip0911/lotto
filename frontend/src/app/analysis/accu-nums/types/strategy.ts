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
  /** 상·하 전략 교집합(통합 극값 제외 기준에서는 사용하지 않으며 빈 배열). */
  commonNumbers: number[];
  /** 통합 분석과 동일: 직전 104회·전체 각 최다·최소 슬롯의 고유 번호(1~4개, 오름차순). */
  finalNumbers: number[];
  strategyPicks: StrategyNumberPick[];
};
