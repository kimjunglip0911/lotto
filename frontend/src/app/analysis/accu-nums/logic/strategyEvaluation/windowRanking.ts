import type {
  AccumulatedStrategyKey,
  AdaptiveWindowSelectionOptions,
  StrategyTopWindow,
  StrategyWindowMetrics,
} from './types';

export function toAtLeastOneRate(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.roundsWithAtLeastOne / a.evaluatedRounds : 0;
}

export function toAvgHits(a: StrategyWindowMetrics): number {
  return a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
}

/** 지표 기준으로 전략별 상위 기간 N개를 뽑는다. */
export function pickTopWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  topN: number,
  options?: { minWindowSize?: number; maxWindowSize?: number }
): StrategyTopWindow[] {
  const rows = aggregates
    .filter((a) => {
      if (a.strategy !== strategy || a.evaluatedRounds <= 0) return false;
      if (options?.minWindowSize !== undefined && a.windowSize < options.minWindowSize) return false;
      if (options?.maxWindowSize !== undefined && a.windowSize > options.maxWindowSize) return false;
      return true;
    })
    .sort((a, b) => {
      const rateDiff = toAtLeastOneRate(b) - toAtLeastOneRate(a);
      if (rateDiff !== 0) return rateDiff;
      const avgDiff = toAvgHits(b) - toAvgHits(a);
      if (avgDiff !== 0) return avgDiff;
      return a.windowSize - b.windowSize;
    })
    .slice(0, topN);

  return rows.map((a) => ({
    strategy: a.strategy,
    windowSize: a.windowSize,
    atLeastOneRate: toAtLeastOneRate(a),
    avgHits: toAvgHits(a),
    maxMissStreak: a.maxMissStreak,
  }));
}

function toWindowQualityScore(row: StrategyTopWindow): number {
  // 적중률/평균적중은 높을수록, 최대 연속 미적중은 낮을수록 유리
  return row.atLeastOneRate * 0.7 + row.avgHits * 0.3 - row.maxMissStreak * 0.006;
}

/** 상위 Top-N 후보 풀에서 간격 제약(minWindowGap)을 두고 동적으로 pickCount개를 고른다. */
export function pickAdaptiveWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  options: AdaptiveWindowSelectionOptions
): StrategyTopWindow[] {
  const { poolSize, pickCount, minWindowGap = 24, minWindowSize, maxWindowSize } = options;
  const pool = pickTopWindowsByStrategy(aggregates, strategy, Math.max(poolSize, pickCount), {
    minWindowSize,
    maxWindowSize,
  });
  const ranked = [...pool].sort((a, b) => {
    const diff = toWindowQualityScore(b) - toWindowQualityScore(a);
    if (diff !== 0) return diff;
    return a.windowSize - b.windowSize;
  });

  const picked: StrategyTopWindow[] = [];
  for (const row of ranked) {
    if (picked.length >= pickCount) break;
    const tooClose = picked.some((p) => Math.abs(p.windowSize - row.windowSize) < minWindowGap);
    if (!tooClose) {
      picked.push(row);
    }
  }
  if (picked.length < pickCount) {
    for (const row of ranked) {
      if (picked.length >= pickCount) break;
      if (!picked.some((p) => p.windowSize === row.windowSize)) {
        picked.push(row);
      }
    }
  }
  return picked;
}
