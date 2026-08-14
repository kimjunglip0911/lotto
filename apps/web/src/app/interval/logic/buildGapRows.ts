/**
 * 미추첨 간격 표에 들어갈 계산 결과를 만드는 파일입니다.
 *
 * 하는 일
 * - 최근 1년 표본과 본번호+보너스로 순위·미추첨 기간·최대를 만듭니다.
 */

import { buildGapRankRows } from '@/app/recommend/logic/gap/gapRank';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_WINDOW_ONE_YEAR } from '@/lib/statsWindow';
import type { GapRow } from '../types/interval';

const maxDrawNo = (rows: readonly WinningNumberRow[]): number =>
  rows.reduce((max, row) => Math.max(max, row.draw_no), 0);

export const gapDrawCount = (rows: readonly WinningNumberRow[]): number =>
  sliceLatestStatsHistory(rows, STATS_WINDOW_ONE_YEAR).length;

export const buildGapRows = (rows: readonly WinningNumberRow[]): GapRow[] => {
  const maxDraw = maxDrawNo(rows);
  if (maxDraw === 0) return [];
  const windowed = sliceLatestStatsHistory(rows, STATS_WINDOW_ONE_YEAR);
  return buildGapRankRows(windowed, maxDraw + 1).map((row) => ({
    rank: row.rank,
    number: row.number,
    currentGap: row.currentGap,
    maxGap: row.maxGap,
  }));
};
