/**
 * 균등 분석용 당첨 이력을 accu-nums API로 불러온다.
 */
import {
  fetchDrawNumbers,
  fetchWinningNumbersRange,
  type AccumulatedNumbersFetchContext,
} from '@/lib/accu-nums/api';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

export type LoadEqualHistoryCtx = Pick<AccumulatedNumbersFetchContext, 'baseUrl' | 'signal'>;

export async function loadEqualHistory(
  ctx?: LoadEqualHistoryCtx,
): Promise<WinningNumberRow[]> {
  const draws = await fetchDrawNumbers(ctx);
  if (draws.length === 0) return [];

  const maxDraw = Math.max(...draws);
  const rows = await fetchWinningNumbersRange(maxDraw + 1, ctx);
  return [...rows].sort((a, b) => a.draw_no - b.draw_no);
}
