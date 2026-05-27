import {
  fetchDrawNumbers,
  fetchWinningNumbersRange,
  type ChiSquareFetchContext,
} from '@/app/analysis/chi-square/api';
import type { WinningNumberRow } from '@/app/analysis/chi-square/types';

export type LoadCombinationHistoryCtx = Pick<ChiSquareFetchContext, 'baseUrl' | 'signal'>;

/** chi-square API로 전체 당첨 이력을 draw_no 오름차순으로 불러온다. */
export async function loadCombinationHistory(
  ctx?: LoadCombinationHistoryCtx,
): Promise<WinningNumberRow[]> {
  const draws = await fetchDrawNumbers(ctx);
  if (draws.length === 0) return [];

  const maxDraw = Math.max(...draws);
  const rows = await fetchWinningNumbersRange(maxDraw + 1, ctx);
  return [...rows].sort((a, b) => a.draw_no - b.draw_no);
}
