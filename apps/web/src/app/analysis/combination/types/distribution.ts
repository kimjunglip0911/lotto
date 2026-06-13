/** 정렬된 주6의 자리(1~6) × 번호대별 집계 행 */
export type PositionBandDistributionRow = {
  /** 1~6 (num1~num6) */
  position: number;
  bandLabel: string;
  drawCount: number;
  /** 해당 자리 기준 비율(0~100), 소수 둘째 자리; 동일 자리 45행(1단위 구간) 합은 100.00 */
  percentage: number;
};

/** 주6 합산 극단(고·저 각 5% 제외) 및 최근 창 건수 */
export type SumExtremeStats = {
  totalDraws: number;
  /** 고: 합 내림차순 앞쪽(큰 합) ceil(5% × n)건 제외 */
  extremeKHigh: number;
  /** 저: 합 오름차순 앞쪽(작은 합 = 순위상 상위) ceil(5% × n)건 제외 */
  extremeKLow: number;
  /** extremeKHigh 제외 후 남은 회차 중 합산 최댓값; n≤k이면 null */
  trimmedMaxSum: number | null;
  /** extremeKLow 제외 후 남은 회차 중 합산 최솟값; n≤k이면 null */
  trimmedMinSum: number | null;
  /** 최근 창 실제 크기(min(52, n)) */
  recentWindowSize: number;
  /** 최근 창 중 주6 합산이 trimmedMaxSum 이상인 회차 수 */
  recentTopExtremeCount: number;
  /** 최근 창 중 주6 합산이 trimmedMinSum 이하인 회차 수 */
  recentBottomExtremeCount: number;
};
