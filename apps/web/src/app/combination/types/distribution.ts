/** 정렬된 주6의 자리(1~6) × 번호대별 집계 행 */
export type PositionBandDistributionRow = {
  /** 1~6 (num1~num6) */
  position: number;
  bandLabel: string;
  drawCount: number;
  /** 해당 자리 기준 비율(0~100), 소수 둘째 자리; 동일 자리 45행(1단위 구간) 합은 100.00 */
  percentage: number;
};

/** 자리 내 출현 비율 순위(1등=최다)가 붙은 구간별 집계 행 */
export type PositionBandRankRow = PositionBandDistributionRow & {
  rank: number;
};
