import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import type { SumExtremeStats } from '../types';

type RowWithSum = {
  drawNo: number;
  sum: number;
};

function mainSum(row: WinningNumberRow): number {
  return row.num1 + row.num2 + row.num3 + row.num4 + row.num5 + row.num6;
}

/**
 * 전체 회차 기준 주6 합산(보너스 제외) 극단 통계.
 * 고: 합 내림차순에서 앞쪽(가장 큰 합) ceil(10%×n)회차 제외 후, 남은 합 중 최댓값.
 * 저: 합 오름차순으로 두면 앞쪽이 가장 작은 합 → 이 "순위상 앞(상위)" ceil(5%×n)회차를 제외한 뒤,
 *     남은 합 중 최솟값. 제외 비율을 키우면 더 많은 낮은 합이 잘리므로 이 값은 커짐(예: 98→113).
 * 동점이면 draw_no 오름차순으로 순위 고정.
 */
export function buildSumExtremeStats(rows: readonly WinningNumberRow[]): SumExtremeStats | null {
  const n = rows.length;
  if (n === 0) {
    return null;
  }

  const withSum: RowWithSum[] = rows.map((r) => ({
    drawNo: r.draw_no,
    sum: mainSum(r),
  }));

  const extremeKHigh = Math.min(Math.ceil(n * 0.1), n);
  const extremeKLow = Math.min(Math.ceil(n * 0.05), n);

  const sortedDesc = [...withSum].sort((a, b) => b.sum - a.sum || a.drawNo - b.drawNo);
  const sortedAsc = [...withSum].sort((a, b) => a.sum - b.sum || a.drawNo - b.drawNo);

  const trimmedMaxSum = n > extremeKHigh ? sortedDesc[extremeKHigh].sum : null;
  const trimmedMinSum = n > extremeKLow ? sortedAsc[extremeKLow].sum : null;

  const sortedByDraw = [...withSum].sort((a, b) => a.drawNo - b.drawNo);
  const recentWindowSize = Math.min(52, n);
  const recentSlice = sortedByDraw.slice(-recentWindowSize);

  /** 최근 창: 표에 나온 트림 고/저 합산을 임계값으로 ≥ / ≤ 비교 */
  let recentTopExtremeCount = 0;
  let recentBottomExtremeCount = 0;
  for (const r of recentSlice) {
    if (trimmedMaxSum !== null && r.sum >= trimmedMaxSum) recentTopExtremeCount++;
    if (trimmedMinSum !== null && r.sum <= trimmedMinSum) recentBottomExtremeCount++;
  }

  return {
    totalDraws: n,
    extremeKHigh,
    extremeKLow,
    trimmedMaxSum,
    trimmedMinSum,
    recentWindowSize,
    recentTopExtremeCount,
    recentBottomExtremeCount,
  };
}
