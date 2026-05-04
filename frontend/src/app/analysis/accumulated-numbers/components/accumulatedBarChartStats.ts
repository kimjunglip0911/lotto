/**
 * 누적 번호 분석 화면의 막대 차트에 쓰는 **표시용 숫자**만 만듭니다.
 *
 * - 1~45번 각각의 출현 횟수(`counts`)는 부모·훅에서 이미 집계된 배열을 그대로 받습니다.
 * - 여기서는 최댓값 대비 막대 높이(%)와, 전체 평균 출현에 해당하는 가로선 위치만 계산합니다.
 */

export const CHART_BAR_HEIGHT_PX = 145;
export const CHART_BOTTOM_LABEL_OFFSET_PX = 14;

export type AccumulatedBarChartStats = {
  /** 집계 구간에서 번호당 평균적으로 몇 번 나왔는지(표시용 소수) */
  averageCount: number;
  /** 평균선을 그릴 때 `bottom` CSS(px) — 막대 영역 기준 */
  averageLineBottomPx: number;
  chartRows: {
    number: number;
    count: number;
    /** 최댓값 대비 막대 높이 0~100% */
    ratio: number;
  }[];
};

/**
 * 막대 차트 한 덩어리에 필요한 값을 한 번에 계산합니다.
 * `analyzedDrawCountForChart`는 평균 출현 횟수 분모로 쓰이는 “집계에 포함된 회차 수”입니다.
 */
export function toChartStats(counts: number[], analyzedDrawCountForChart: number): AccumulatedBarChartStats {
  const maxCount = Math.max(...counts, 0);
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  const averageCount = analyzedDrawCountForChart > 0 ? totalCount / counts.length : 0;
  const averageRatio = maxCount > 0 ? (averageCount / maxCount) * 100 : 0;
  const clampedAverageRatio = Math.min(100, Math.max(0, averageRatio));
  const averageLineBottomPx =
    CHART_BOTTOM_LABEL_OFFSET_PX + (clampedAverageRatio / 100) * CHART_BAR_HEIGHT_PX;
  const chartRows = counts.map((count, index) => ({
    number: index + 1,
    count,
    ratio: maxCount > 0 ? (count / maxCount) * 100 : 0,
  }));

  return {
    averageCount,
    averageLineBottomPx,
    chartRows,
  };
}
