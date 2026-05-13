/** 누적 분석 윈도우 설정(전략 평가 등에서 직전 104회 구간 정의에 사용). */
export type WindowKey = 'period104';

export type WindowConfig = {
  key: WindowKey;
  title: string;
  windowSize: number;
  noDataMessage: string;
};
