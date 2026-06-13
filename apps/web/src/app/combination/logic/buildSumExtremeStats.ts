import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { STATS_WINDOW_DRAWS } from '@/lib/statsWindow';
import { mainSum } from '../helpers/mainSum';
import type { SumExtremeStats } from '../types';

type RowWithSum = {
  drawNo: number;
  sum: number;
};

function countRecentExtremes(
  recentSlice: readonly RowWithSum[],
  trimmedMaxSum: number | null,
  trimmedMinSum: number | null,
): { top: number; bottom: number } {
  let top = 0;
  let bottom = 0;
  for (const r of recentSlice) {
    if (trimmedMaxSum !== null && r.sum >= trimmedMaxSum) top++;
    if (trimmedMinSum !== null && r.sum <= trimmedMinSum) bottom++;
  }
  return { top, bottom };
}

/**
 * 주6 합산(보너스 제외) 극단 통계. 표본은 호출 측에서 3개월(13회) 등으로 제한된 rows.
 * 고: 합 내림차순에서 앞쪽(가장 큰 합) ceil(5%×n)회차 제외 후, 남은 합 중 최댓값.
 * 저: 합 오름차순 앞쪽 ceil(5%×n)회차 제외 후, 남은 합 중 최솟값.
 */
export function buildSumExtremeStats(rows: readonly WinningNumberRow[]): SumExtremeStats | null {
  const n = rows.length;
  if (n === 0) return null;

  const withSum: RowWithSum[] = rows.map((r) => ({ drawNo: r.draw_no, sum: mainSum(r) }));
  const extremeKHigh = Math.min(Math.ceil(n * 0.05), n);
  const extremeKLow = Math.min(Math.ceil(n * 0.05), n);

  const sortedDesc = [...withSum].sort((a, b) => b.sum - a.sum || a.drawNo - b.drawNo);
  const sortedAsc = [...withSum].sort((a, b) => a.sum - b.sum || a.drawNo - b.drawNo);
  const trimmedMaxSum = n > extremeKHigh ? sortedDesc[extremeKHigh].sum : null;
  const trimmedMinSum = n > extremeKLow ? sortedAsc[extremeKLow].sum : null;

  const recentSlice = [...withSum].sort((a, b) => a.drawNo - b.drawNo).slice(-Math.min(STATS_WINDOW_DRAWS, n));
  const recent = countRecentExtremes(recentSlice, trimmedMaxSum, trimmedMinSum);

  return {
    totalDraws: n,
    extremeKHigh,
    extremeKLow,
    trimmedMaxSum,
    trimmedMinSum,
    recentWindowSize: recentSlice.length,
    recentTopExtremeCount: recent.top,
    recentBottomExtremeCount: recent.bottom,
  };
}
