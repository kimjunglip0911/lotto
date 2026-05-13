/** 누적 분석 윈도우 설정과 차트 파생 데이터 타입. */
export type WindowKey = 'period104';

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
