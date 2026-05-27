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
  drawCount: number;
  winningHitDrawCount: number;
  appearanceProbability: number;
};

/** `aggregateDeviationBins` 결과 */
export type DeviationBinsSummary = {
  rows: DeviationBinRow[];
  validDrawCount: number;
  skippedDrawCount: number;
};
