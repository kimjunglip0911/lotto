export type WinningNumberRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

export type WindowKey = 'period136' | 'period192' | 'period320' | 'period336';

export type WindowConfig = {
  key: WindowKey;
  title: string;
  windowSize: number;
  noDataMessage: string;
};

export type WindowChartData = {
  key: WindowKey;
  title: string;
  counts: number[];
  analyzedDrawCount: number;
  noDataMessage: string;
};

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
  strategyKey: 'nearestMean4' | 'twoHotTwoCold';
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

/** 회차 묶음 기준 번호별 집계 결과(차트·안내용). */
export type CountResult = {
  counts: number[];
  analyzedDrawCount: number;
};

/** 윈도우 키별 집계 결과 맵. */
export type WindowCountResultMap = Record<WindowKey, CountResult>;

/** 백엔드 `AccumulatedNumberSnapshotSaveRequest.schema_version` (2=최종 채택 4개만 저장). */
export const ACCUMULATED_SNAPSHOT_SCHEMA_VERSION = 2;
