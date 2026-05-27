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
  /** 해당 구간이 1회 이상 나타난 회차 수 */
  drawCount: number;
  /** 해당 구간이 나타난 회차 중 실제 당첨 주6이 포함된 회차 수 */
  winningHitDrawCount: number;
  /** 0~100, winningHitDrawCount / drawCount */
  appearanceProbability: number;
};

/** `aggregateDeviationBins` 결과 */
export type DeviationBinsSummary = {
  rows: DeviationBinRow[];
  /** 집계에 사용된 회차 수 */
  validDrawCount: number;
  /** 이력이 없거나 기댓값이 너무 작아 제외된 회차 수 */
  skippedDrawCount: number;
};
