import type { WinningNumberRow } from '../../types';
import type { AccumulatedEvaluationBucket, StrategyWindowMetrics } from './types';

/** 당첨 행 배열에서 draw_no → 행 맵(스냅샷 일괄 시 전체 DB 한 번만 빌드). */
export function buildDrawNoToWinningRowMap(allRowsSortedAsc: WinningNumberRow[]): Map<number, WinningNumberRow> {
  const drawRow = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawRow.set(row.draw_no, row);
  }
  return drawRow;
}

export function aggregatesFromEvaluationBucket(bucket: AccumulatedEvaluationBucket): StrategyWindowMetrics[] {
  const aggregates: StrategyWindowMetrics[] = [...bucket.values()].map((b) => ({
    strategy: b.strategy,
    windowSize: b.windowSize,
    evaluatedRounds: b.evaluatedRounds,
    sumHits: b.sumHits,
    roundsWithAtLeastOne: b.roundsWithAtLeastOne,
    minHits: b.evaluatedRounds === 0 ? 0 : b.minHits === Number.POSITIVE_INFINITY ? 0 : b.minHits,
    worstDrawNo: b.evaluatedRounds === 0 ? null : b.worstDrawNo,
    maxMissStreak: b.maxMissStreak,
  }));

  aggregates.sort((a, b) => {
    if (a.strategy !== b.strategy) {
      return a.strategy.localeCompare(b.strategy);
    }
    return a.windowSize - b.windowSize;
  });

  return aggregates;
}
