import type { WinningNumberRow } from '../../types';
import { buildNumberCounts, toMainNumbersOnly } from '../numCounts';
import { countMainHits, pickFourByStrategy } from './numPick';
import type {
  AccumulatedEvaluationBucket,
  AccumulatedStrategyKey,
} from './types';
import { sliceWindowTail, upperBoundDrawNo } from './winSlice';

const evaluationAggKey = (s: AccumulatedStrategyKey, w: number) => `${s}\t${w}`;

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
