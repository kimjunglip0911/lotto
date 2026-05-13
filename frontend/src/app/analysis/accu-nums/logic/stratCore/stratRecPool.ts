/** 두 전략 추천 번호 풀에서 점수·조합 탐색으로 최종 4개를 고른다. */

import type { StrategyRecommendation } from './types';
import { hasValidHardConstraints } from './stratRecHard';

function mergeScores(
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation
): {
  candidatePool: number[];
  candidateScore: Map<number, number>;
  merged: number[];
} {
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

  return { candidatePool, candidateScore, merged };
}

export function pickBestFinalFourPair(
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation
): { commonNumbers: number[]; finalNumbers: number[] } {
  const bSet = new Set(strategyB.numbers);
  const commonNumbers = strategyA.numbers.filter((n) => bSet.has(n)).sort((x, y) => x - y);

  const { candidatePool, candidateScore, merged } = mergeScores(strategyA, strategyB);

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
    commonNumbers,
    finalNumbers: finalNumbers.sort((a, b) => a - b).slice(0, 4),
  };
}
