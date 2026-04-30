import { WINDOW_CONFIGS } from '../constants';
import type { WinningNumberRow } from '../types';
import { buildNumberCounts, toMainNumbersOnly } from './numberCounts';

/** 누적 집계(본번호+보너스)로 번호 4개를 고르는 규칙 키 */
export type BacktestStrategyKey =
  | 'top4Frequency'
  | 'bottom4Frequency'
  | 'nearestMean4'
  | 'twoHotTwoCold';

export const BACKTEST_STRATEGY_KEYS: readonly BacktestStrategyKey[] = [
  'top4Frequency',
  'bottom4Frequency',
  'nearestMean4',
  'twoHotTwoCold',
] as const;

/** 백테스트 기본 집중 분석: 평균 근접 + 상위2·하위2 (상·하위 단독 전략 제외) */
export const BACKTEST_FOCUS_STRATEGY_KEYS: readonly BacktestStrategyKey[] = [
  'nearestMean4',
  'twoHotTwoCold',
] as const;

export type BacktestAggregate = {
  strategy: BacktestStrategyKey;
  windowSize: number;
  evaluatedRounds: number;
  sumHits: number;
  roundsWithAtLeastOne: number;
  /** 평가된 회차들 중 적중 개수 최솟값 */
  minHits: number;
  /** minHits가 나온 회차(동률이면 가장 작은 draw_no) */
  worstDrawNo: number | null;
  /** 연속 미적중(0개 적중) 최대 길이 */
  maxMissStreak: number;
};

export type StrategyTopWindow = {
  strategy: BacktestStrategyKey;
  windowSize: number;
  atLeastOneRate: number;
  avgHits: number;
  maxMissStreak: number;
};

type AdaptiveWindowSelectionOptions = {
  poolSize: number;
  pickCount: number;
  minWindowGap?: number;
  minWindowSize?: number;
  maxWindowSize?: number;
};

export type StrategyRecommendation = {
  strategy: BacktestStrategyKey;
  windowSize: number;
  numbers: number[];
  scoreByNumber: Record<number, number>;
  metrics: {
    atLeastOneRate: number;
    avgHits: number;
    maxMissStreak: number;
  };
};

export type FinalNumberSelection = {
  strategyA: StrategyRecommendation;
  strategyB: StrategyRecommendation;
  commonNumbers: number[];
  finalNumbers: number[];
};

type BacktestWindowSweepOptions = {
  minWindowSize?: number;
  maxWindowSize?: number;
};

/**
 * UI에 정의된 윈도우 + 다구간 스윕 후보를 생성한다.
 * - 단기(4~120): 4간격으로 촘촘히
 * - 중기(128~600): 8간격
 * - 장기(616~max): 16간격
 */
export function getDefaultBacktestWindowSizes(options?: BacktestWindowSweepOptions): number[] {
  const minWindow = Math.max(1, options?.minWindowSize ?? 4);
  const maxWindow = Math.max(minWindow, options?.maxWindowSize ?? 520);
  const fromUi = WINDOW_CONFIGS.map((c) => c.windowSize);
  const sweep: number[] = [];

  for (let w = minWindow; w <= Math.min(maxWindow, 120); w += 4) {
    sweep.push(w);
  }
  for (let w = Math.max(minWindow, 128); w <= Math.min(maxWindow, 600); w += 8) {
    sweep.push(w);
  }
  for (let w = Math.max(minWindow, 616); w <= maxWindow; w += 16) {
    sweep.push(w);
  }
  return [...new Set([...fromUi, ...sweep])].sort((a, b) => a - b);
}

/** draw_no 오름차순 정렬 전제 — drawNo 미만 회차만 담은 슬라이스 상한 인덱스 */
export function upperBoundDrawNo(sortedAsc: WinningNumberRow[], drawNo: number): number {
  let lo = 0;
  let hi = sortedAsc.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedAsc[mid].draw_no < drawNo) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/** 직전 회차들 중 마지막 windowSize개(부족하면 있는 만큼) */
export function sliceWindowTail(priorSortedAsc: WinningNumberRow[], windowSize: number): WinningNumberRow[] {
  if (priorSortedAsc.length === 0 || windowSize < 1) {
    return [];
  }
  const n = Math.min(windowSize, priorSortedAsc.length);
  return priorSortedAsc.slice(priorSortedAsc.length - n);
}

const countAt = (counts: number[], number1To45: number): number =>
  counts[number1To45 - 1] ?? 0;

/** 출현 횟수 내림차순, 동률이면 번호 오름차순 */
function sortByCountDescThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => b.count - a.count || a.number - b.number);
}

/** 출현 횟수 오름차순, 동률이면 번호 오름차순 */
function sortByCountAscThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => a.count - b.count || a.number - b.number);
}

export function pickTop4ByFrequency(counts: number[]): number[] {
  return sortByCountDescThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);
}

export function pickBottom4ByFrequency(counts: number[]): number[] {
  return sortByCountAscThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);
}

export function pickNearestMean4(counts: number[]): number[] {
  const total = counts.reduce((s, c) => s + c, 0);
  const mean = total / 45;
  const scored = Array.from({ length: 45 }, (_, i) => {
    const number = i + 1;
    const c = countAt(counts, number);
    return { number, diff: Math.abs(c - mean) };
  });
  scored.sort((a, b) => a.diff - b.diff || a.number - b.number);
  return scored.slice(0, 4).map((e) => e.number);
}

export function pickTwoHotTwoCold(counts: number[]): number[] {
  const desc = sortByCountDescThenNumberAsc(counts);
  const asc = sortByCountAscThenNumberAsc(counts);
  const picked = new Set<number>();
  for (const e of desc) {
    if (picked.size >= 2) break;
    picked.add(e.number);
  }
  for (const e of asc) {
    if (picked.size >= 4) break;
    if (!picked.has(e.number)) {
      picked.add(e.number);
    }
  }
  // 이론상 45개 중 4개 미만이 될 수 없음 — 안전하게 부족하면 desc 순으로 채움
  for (const e of desc) {
    if (picked.size >= 4) break;
    picked.add(e.number);
  }
  return [...picked].sort((a, b) => a - b).slice(0, 4);
}

export function pickFourByStrategy(counts: number[], strategy: BacktestStrategyKey): number[] {
  switch (strategy) {
    case 'top4Frequency':
      return pickTop4ByFrequency(counts);
    case 'bottom4Frequency':
      return pickBottom4ByFrequency(counts);
    case 'nearestMean4':
      return pickNearestMean4(counts);
    case 'twoHotTwoCold':
      return pickTwoHotTwoCold(counts);
  }
}

export function countMainHits(predictedFour: number[], actualMainSix: number[]): number {
  const actual = new Set(actualMainSix);
  return predictedFour.reduce((acc, n) => acc + (actual.has(n) ? 1 : 0), 0);
}

export function toAtLeastOneRate(a: BacktestAggregate): number {
  return a.evaluatedRounds > 0 ? a.roundsWithAtLeastOne / a.evaluatedRounds : 0;
}

export function toAvgHits(a: BacktestAggregate): number {
  return a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
}

export type RunAccumulatedNumbersBacktestParams = {
  /** draw_no 오름차순 */
  allRowsSortedAsc: WinningNumberRow[];
  /** 평가할 각 회차 D(직전 누적만 사용: draw_no < D) */
  drawNumbersToEvaluate: number[];
  windowSizes: number[];
  strategyKeys: readonly BacktestStrategyKey[];
};

/**
 * 회차별 rolling 예측 4개 vs 해당 회차 본번호 6개 적중을 집계한다.
 * 집계(counts)는 차트와 동일하게 본번호+보너스 출현 합이다.
 */
export function runAccumulatedNumbersBacktest(params: RunAccumulatedNumbersBacktestParams): {
  aggregates: BacktestAggregate[];
} {
  const { allRowsSortedAsc, drawNumbersToEvaluate, windowSizes, strategyKeys } = params;

  const drawRow = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawRow.set(row.draw_no, row);
  }

  const aggKey = (s: BacktestStrategyKey, w: number) => `${s}\t${w}`;
  const bucket = new Map<
    string,
    {
      strategy: BacktestStrategyKey;
      windowSize: number;
      evaluatedRounds: number;
      sumHits: number;
      roundsWithAtLeastOne: number;
      minHits: number;
      worstDrawNo: number | null;
      currentMissStreak: number;
      maxMissStreak: number;
    }
  >();

  const ensure = (strategy: BacktestStrategyKey, windowSize: number) => {
    const k = aggKey(strategy, windowSize);
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
    const row = drawRow.get(drawNo);
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

  const aggregates: BacktestAggregate[] = [...bucket.values()].map((b) => ({
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

  return { aggregates };
}

/** 지표 기준으로 전략별 상위 기간 N개를 뽑는다. */
export function pickTopWindowsByStrategy(
  aggregates: BacktestAggregate[],
  strategy: BacktestStrategyKey,
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
  aggregates: BacktestAggregate[],
  strategy: BacktestStrategyKey,
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

function toScoreByNumber(
  strategy: BacktestStrategyKey,
  aggregate: BacktestAggregate,
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
  strategy: BacktestStrategyKey;
  windowSize: number;
  allRowsBeforeSelectedDraw: WinningNumberRow[];
  aggregate: BacktestAggregate;
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
