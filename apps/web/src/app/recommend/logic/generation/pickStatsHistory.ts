/**
 * 추천 생성에 쓸 당첨 이력을 기준 회차 직전·최근 N회로 잘라 준다.
 * - 받음: 전체 이력, 기준 회차 번호, 윈도우 크기(기본 26회·6개월)
 * - 돌려줌: 기준 회차 미만 중 최근 N회(부족하면 있는 만큼)
 */
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { STATS_WINDOW_DRAWS } from '@/app/recommend/constants/statsWindow';

export const pickStatsHistory = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
  windowSize: number = STATS_WINDOW_DRAWS,
): WinningNumberRow[] => {
  const prior = rows
    .filter((r) => r.draw_no < referenceDrawNo)
    .sort((a, b) => a.draw_no - b.draw_no);
  if (prior.length <= windowSize) return prior;
  return prior.slice(-windowSize);
};
