/** 같은 전략의 여러 기간 추천을 점수 합산으로 통합 */

import type { StrategyRecommendation } from './types';

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
