import type { WinningNumberRow } from '../../../types';
import type { AccumulatedEvaluationBucket, StrategyWindowMetrics } from '../types';

/** 당첨 이력에서 회차 번호로 당첨 행을 찾는 맵을 만들고, 집계 버킷을 지표 행으로 바꾼다. */
export function buildDrawNoToWinningRowMap(allRowsSortedAsc: WinningNumberRow[]): Map<number, WinningNumberRow> {
  const drawRow = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawRow.set(row.draw_no, row);
  }
  return drawRow;
}

/** 회차별로 쌓인 내부 버킷을 화면·집계용 `StrategyWindowMetrics` 배열로 바꾼다. */
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
