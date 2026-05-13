import type { WinningNumberRow } from '../../types';
import { buildNumberCounts } from '../numCounts';
import { pickFourByStrategy } from './numPick';
import type {
  AccumulatedStrategyKey,
  FinalNumberSelection,
  StrategyRecommendation,
  StrategyWindowMetrics,
} from './types';
import { sliceWindowTail } from './winSlice';
import { toAtLeastOneRate, toAvgHits } from './winRank';

function toScoreByNumber(
  strategy: AccumulatedStrategyKey,
  aggregate: StrategyWindowMetrics,
  numbers: number[]
): Record<number, number> {
  const base = toAtLeastOneRate(aggregate) * 0.7 + toAvgHits(aggregate) * 0.3;
  const spreadWeight = strategy === 'nearestMean4' ? 0.02 : 0.015;
  const sorted = [...numbers].sort((a, b) => a - b);
  const entries = sorted.map((n, idx) => [n, base - idx * spreadWeight] as const);
  return Object.fromEntries(entries) as Record<number, number>;
}

/** 선택 draw 이전 데이터에서 특정 전략/기간으로 추천 4개를 만든다. */
export function buildStrategyRecommendation(params: {
  strategy: AccumulatedStrategyKey;
  windowSize: number;
  allRowsBeforeSelectedDraw: WinningNumberRow[];
  aggregate: StrategyWindowMetrics;
}): StrategyRecommendation {
  const { strategy, windowSize, allRowsBeforeSelectedDraw, aggregate } = params;
  const windowRows = sliceWindowTail(allRowsBeforeSelectedDraw, windowSize);
  const counts = buildNumberCounts(windowRows);
  const numbers = pickFourByStrategy(counts, strategy);
  return {
    strategy,
    windowSize,
    numbers,
    scoreByNumber: toScoreByNumber(strategy, aggregate, numbers),
    metrics: {
      atLeastOneRate: toAtLeastOneRate(aggregate),
      avgHits: toAvgHits(aggregate),
      maxMissStreak: aggregate.maxMissStreak,
    },
  };
}

/** 같은 전략의 여러 기간 추천을 점수 합산으로 통합해 최종 4개를 만든다. */
export function combineStrategyRecommendations(
  recommendations: StrategyRecommendation[]
): StrategyRecommendation | null {
  if (recommendations.length === 0) {
    return null;
  }

  const strategy = recommendations[0].strategy;
  const scoreMap = new Map<number, number>();
  for (const rec of recommendations) {
    for (const [nStr, score] of Object.entries(rec.scoreByNumber)) {
      const n = Number(nStr);
      scoreMap.set(n, (scoreMap.get(n) ?? 0) + score);
    }
  }

  const mergedNumbers = [...scoreMap.entries()]
    .sort((a, b) => {
      const diff = b[1] - a[1];
      if (diff !== 0) return diff;
      return a[0] - b[0];
    })
    .slice(0, 4)
    .map(([n]) => n);

  const atLeastOneRate =
    recommendations.reduce((sum, rec) => sum + rec.metrics.atLeastOneRate, 0) / recommendations.length;
  const avgHits = recommendations.reduce((sum, rec) => sum + rec.metrics.avgHits, 0) / recommendations.length;
  const maxMissStreak = Math.max(...recommendations.map((rec) => rec.metrics.maxMissStreak));

  const mergedScoreByNumber = Object.fromEntries(
    [...scoreMap.entries()].map(([n, score]) => [n, score])
  ) as Record<number, number>;

  return {
    strategy,
    windowSize: recommendations[0].windowSize,
    numbers: mergedNumbers,
    scoreByNumber: mergedScoreByNumber,
    metrics: {
      atLeastOneRate,
      avgHits,
      maxMissStreak,
    },
  };
}

/** 공통번호 우선, 부족분은 점수(높은 순)로 채워 최종 4개를 만든다. */
export function buildFinalNumberSelection(
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation
): FinalNumberSelection {
  const bSet = new Set(strategyB.numbers);
  const commonNumbers = strategyA.numbers.filter((n) => bSet.has(n)).sort((x, y) => x - y);

  const scoreMap = new Map<number, number>();
  for (const [nStr, score] of Object.entries(strategyA.scoreByNumber)) {
    scoreMap.set(Number(nStr), (scoreMap.get(Number(nStr)) ?? 0) + score);
  }
  for (const [nStr, score] of Object.entries(strategyB.scoreByNumber)) {
    scoreMap.set(Number(nStr), (scoreMap.get(Number(nStr)) ?? 0) + score);
  }

  const merged = [...new Set([...strategyA.numbers, ...strategyB.numbers])].sort((a, b) => {
    const diff = (scoreMap.get(b) ?? 0) - (scoreMap.get(a) ?? 0);
    if (diff !== 0) return diff;
    return a - b;
  });

  const candidatePool = [...new Set([...strategyA.numbers, ...strategyB.numbers])];
  const candidateScore = new Map<number, number>();
  for (const n of candidatePool) {
    candidateScore.set(n, scoreMap.get(n) ?? 0);
  }

  const bandIndex = (n: number): number => {
    if (n <= 15) return 0;
    if (n <= 30) return 1;
    return 2;
  };
  const hasValidHardConstraints = (nums: number[]): boolean => {
    if (nums.length !== 4) return false;
    const sorted = [...nums].sort((a, b) => a - b);
    const odd = sorted.filter((n) => n % 2 === 1).length;
    const even = 4 - odd;
    if (odd === 0 || even === 0) return false;

    let consecutivePairs = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i] - sorted[i - 1] === 1) consecutivePairs += 1;
    }
    if (consecutivePairs > 1) return false;

    const endDigitCounts = new Map<number, number>();
    const bandCounts = [0, 0, 0];
    for (const n of sorted) {
      const digit = n % 10;
      endDigitCounts.set(digit, (endDigitCounts.get(digit) ?? 0) + 1);
      if ((endDigitCounts.get(digit) ?? 0) > 1) return false;

      const b = bandIndex(n);
      bandCounts[b] += 1;
      if (bandCounts[b] > 2) return false;
    }
    return true;
  };

  const pickByScore = (numbers: number[]): number[] =>
    [...numbers]
      .sort((a, b) => {
        const diff = (candidateScore.get(b) ?? 0) - (candidateScore.get(a) ?? 0);
        if (diff !== 0) return diff;
        return a - b;
      })
      .slice(0, 4);

  const generated: number[] = [];
  const combos: number[][] = [];
  const sortedPool = [...candidatePool].sort((a, b) => a - b);
  const dfs = (start: number) => {
    if (generated.length === 4) {
      combos.push([...generated]);
      return;
    }
    for (let i = start; i < sortedPool.length; i += 1) {
      generated.push(sortedPool[i]);
      dfs(i + 1);
      generated.pop();
    }
  };
  dfs(0);

  const preferred = combos
    .filter((c) => commonNumbers.every((n) => c.includes(n)))
    .filter(hasValidHardConstraints);
  const fallback = combos.filter(hasValidHardConstraints);
  const candidates = preferred.length > 0 ? preferred : fallback;

  const bestConstrained =
    candidates.length > 0
      ? [...candidates].sort((x, y) => {
          const sx = x.reduce((sum, n) => sum + (candidateScore.get(n) ?? 0), 0);
          const sy = y.reduce((sum, n) => sum + (candidateScore.get(n) ?? 0), 0);
          const diff = sy - sx;
          if (diff !== 0) return diff;
          const minX = Math.min(...x);
          const minY = Math.min(...y);
          return minX - minY;
        })[0]
      : null;

  const finalNumbers: number[] = (bestConstrained ? [...bestConstrained] : pickByScore(merged)).sort(
    (a, b) => a - b
  );

  return {
    strategyA,
    strategyB,
    commonNumbers,
    finalNumbers: finalNumbers.sort((a, b) => a - b).slice(0, 4),
  };
}
