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

export type WindowKey =
  | 'thirtyDay'
  | 'ninetyDay'
  | 'sixMonth'
  | 'oneYear'
  | 'threeYear'
  | 'fiveYear'
  | 'tenYear';

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

/** 회차 묶음 기준 번호별 집계 결과(차트·안내용). */
export type CountResult = {
  counts: number[];
  analyzedDrawCount: number;
};

/** 윈도우 키별 집계 결과 맵. */
export type WindowCountResultMap = Record<WindowKey, CountResult>;
