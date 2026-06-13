import {
  fetchDrawNumbers,
  fetchWinningNumbersRange,
  type AccumulatedNumbersFetchContext,
} from '@/lib/accu-nums/api';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { sliceLatestStatsHistory } from '@/lib/pickStatsHistory';
import { STATS_WINDOW_DRAWS } from '@/lib/statsWindow';

export type LoadCombinationHistoryCtx = Pick<AccumulatedNumbersFetchContext, 'baseUrl' | 'signal'>;

/** accu-nums API로 당첨 이력을 불러온 뒤 최근 13회(3개월)만 반환한다. */
export async function loadCombinationHistory(
  ctx?: LoadCombinationHistoryCtx,
): Promise<WinningNumberRow[]> {
  const draws = await fetchDrawNumbers(ctx);
  if (draws.length === 0) return [];

  const maxDraw = Math.max(...draws);
  const rows = await fetchWinningNumbersRange(maxDraw + 1, ctx);
  return sliceLatestStatsHistory(rows, STATS_WINDOW_DRAWS);
}
