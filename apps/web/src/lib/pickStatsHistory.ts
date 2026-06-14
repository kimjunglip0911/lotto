/**
 * 통계 집계·추천 생성에 쓸 당첨 이력을 최근 N회로 잘라 준다.
 * - sliceLatestStatsHistory: 이미 정렬된(또는 임의) 이력에서 최근 N회
 * - pickStatsHistory: 기준 회차 직전 이력에서 최근 N회
 */
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { STATS_WINDOW_DRAWS } from '@/lib/statsWindow';

export const sliceLatestStatsHistory = (
  rows: readonly WinningNumberRow[],
  windowSize: number = STATS_WINDOW_DRAWS,
): WinningNumberRow[] => {
  const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  if (!Number.isFinite(windowSize) || sorted.length <= windowSize) return sorted;
  return sorted.slice(-windowSize);
};

export const pickStatsHistory = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
  windowSize: number = STATS_WINDOW_DRAWS,
): WinningNumberRow[] => {
  const prior = rows.filter((r) => r.draw_no < referenceDrawNo);
  return sliceLatestStatsHistory(prior, windowSize);
};
