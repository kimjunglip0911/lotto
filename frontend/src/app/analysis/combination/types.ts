/** 주6 기준 짝수 개수(0~6) 버킷별 집계 행 */
export type OddEvenDistributionRow = {
  evenCount: number;
  drawCount: number;
  /** 전체 대비 비율(0~100), 소수 둘째 자리 */
  percentage: number;
};

/** 정렬된 주6에서 최대 연속 구간 길이(1~6) 버킷별 집계 행 */
export type ConsecutiveRunDistributionRow = {
  maxRunLength: 1 | 2 | 3 | 4 | 5 | 6;
  drawCount: number;
  /** 전체 대비 비율(0~100), 소수 둘째 자리 */
  percentage: number;
};

/** 정렬된 주6의 자리(1~6) × 번호대별 집계 행 */
export type PositionBandDistributionRow = {
  /** 1~6 (num1~num6) */
  position: number;
  bandLabel: string;
  drawCount: number;
  /** 해당 자리 기준 비율(0~100), 소수 둘째 자리; 동일 자리 5행 합은 100.00 */
  percentage: number;
};
