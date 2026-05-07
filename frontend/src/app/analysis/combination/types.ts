/** 주6 기준 짝수 개수(0~6) 버킷별 집계 행 */
export type OddEvenDistributionRow = {
  evenCount: number;
  drawCount: number;
  /** 전체 대비 비율(0~100), 소수 둘째 자리 */
  percentage: number;
};
