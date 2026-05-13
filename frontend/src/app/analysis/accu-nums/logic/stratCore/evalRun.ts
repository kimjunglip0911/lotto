import type { WinningNumberRow } from '../../types';
import { buildNumberCounts, toMainNumbersOnly } from '../numCounts';
import { countMainHits, pickFourByStrategy } from './numPick';
import type {
  AccumulatedEvaluationBucket,
  AccumulatedStrategyKey,
  RunAccumulatedStrategyEvaluationParams,
  StrategyWindowMetrics,
} from './types';
import { sliceWindowTail, upperBoundDrawNo } from './winSlice';

const evaluationAggKey = (s: AccumulatedStrategyKey, w: number) => `${s}\t${w}`;

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

/**
 * `runAccumulatedStrategyEvaluation`과 동일한 한 회차(또는 여러 회차) 집계를 **기존 버킷에 더한다**.
 * `drawRowByNo`는 조회 대상 회차가 포함되도록 충분히 넓은 맵이면 된다(전체 당첨 테이블 권장).
 */
export function accumulateStrategyEvaluationRounds(params: {
  allRowsSortedAsc: WinningNumberRow[];
  drawNumbersToEvaluate: number[];
  windowSizes: number[];
  strategyKeys: readonly AccumulatedStrategyKey[];
  drawRowByNo: Map<number, WinningNumberRow>;
  bucket: AccumulatedEvaluationBucket;
}): void {
  const { allRowsSortedAsc, drawNumbersToEvaluate, windowSizes, strategyKeys, drawRowByNo, bucket } = params;

  const ensure = (strategy: AccumulatedStrategyKey, windowSize: number) => {
    const k = evaluationAggKey(strategy, windowSize);
    let b = bucket.get(k);
    if (!b) {
      b = {
        strategy,
        windowSize,
        evaluatedRounds: 0,
        sumHits: 0,
        roundsWithAtLeastOne: 0,
        minHits: Number.POSITIVE_INFINITY,
        worstDrawNo: null,
        currentMissStreak: 0,
        maxMissStreak: 0,
      };
      bucket.set(k, b);
    }
    return b;
  };

  for (const drawNo of drawNumbersToEvaluate) {
    if (drawNo <= 1) {
      continue;
    }
    const row = drawRowByNo.get(drawNo);
    if (!row) {
      continue;
    }
    const actualMain = toMainNumbersOnly(row);
    const priorEnd = upperBoundDrawNo(allRowsSortedAsc, drawNo);
    const priorSortedAsc = allRowsSortedAsc.slice(0, priorEnd);
    if (priorSortedAsc.length === 0) {
      continue;
    }

    for (const windowSize of windowSizes) {
      const windowRows = sliceWindowTail(priorSortedAsc, windowSize);
      if (windowRows.length === 0) {
        continue;
      }
      const counts = buildNumberCounts(windowRows);

      for (const strategy of strategyKeys) {
        const predicted = pickFourByStrategy(counts, strategy);
        const hits = countMainHits(predicted, actualMain);
        const b = ensure(strategy, windowSize);
        b.evaluatedRounds += 1;
        b.sumHits += hits;
        if (hits >= 1) {
          b.roundsWithAtLeastOne += 1;
          b.currentMissStreak = 0;
        } else {
          b.currentMissStreak += 1;
          if (b.currentMissStreak > b.maxMissStreak) {
            b.maxMissStreak = b.currentMissStreak;
          }
        }
        if (hits < b.minHits) {
          b.minHits = hits;
          b.worstDrawNo = drawNo;
        } else if (hits === b.minHits && b.worstDrawNo !== null && drawNo < b.worstDrawNo) {
          b.worstDrawNo = drawNo;
        }
      }
    }
  }
}

/**
 * 회차별 rolling 예측 4개 vs 해당 회차 본번호 6개 적중을 집계한다.
 * 집계(counts)는 차트와 동일하게 본번호+보너스 출현 합이다.
 */
export function runAccumulatedStrategyEvaluation(
  params: RunAccumulatedStrategyEvaluationParams
): {
  aggregates: StrategyWindowMetrics[];
} {
  const { allRowsSortedAsc, drawNumbersToEvaluate, windowSizes, strategyKeys } = params;

  const drawRowByNo = buildDrawNoToWinningRowMap(allRowsSortedAsc);
  const bucket: AccumulatedEvaluationBucket = new Map();
  accumulateStrategyEvaluationRounds({
    allRowsSortedAsc,
    drawNumbersToEvaluate,
    windowSizes,
    strategyKeys,
    drawRowByNo,
    bucket,
  });

  return { aggregates: aggregatesFromEvaluationBucket(bucket) };
}
