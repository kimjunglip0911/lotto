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

export type NumberTrendResult = {
  number: number;
  ema: number;
};

/** 기댓값 대비 EMA 편차(%) 구간 한 줄(표·스크립트 공통) */
export type DeviationBinRow = {
  key: string;
  label: string;
  count: number;
  /** 0~100, 유효 표본 대비 비율 */
  percent: number;
};

/** `aggregateDeviationBins` 결과 */
export type DeviationBinsSummary = {
  rows: DeviationBinRow[];
  /** 구간에 포함된 표본 수(주번호 1개 = 1표본) */
  validSampleCount: number;
  /** 기댓값이 너무 작거나 이력 없어 편차를 쓰지 않은 표본 수 */
  skippedSampleCount: number;
};
