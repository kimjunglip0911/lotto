import type { StrategyRecommendation } from '../types';
import { hasValidHardConstraints } from './stratRecHard';
import { mergeStrategyRecScores } from './stratRecMerge';
import { enumerateFourCombos } from './stratRecEnum';

/** 두 전략 점수를 합친 뒤, 규칙을 지키는 4개 조합 가운데 가장 나은 것을 고른다. */

export function pickBestFinalFourPair(
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation
): { commonNumbers: number[]; finalNumbers: number[] } {
  const bSet = new Set(strategyB.numbers);
  const commonNumbers = strategyA.numbers.filter((n) => bSet.has(n)).sort((x, y) => x - y);

  const { candidatePool, candidateScore, merged } = mergeStrategyRecScores(strategyA, strategyB);

  const pickByScore = (numbers: number[]): number[] =>
    [...numbers]
      .sort((a, b) => {
        const diff = (candidateScore.get(b) ?? 0) - (candidateScore.get(a) ?? 0);
        if (diff !== 0) return diff;
        return a - b;
      })
      .slice(0, 4);

  const sortedPool = [...candidatePool].sort((a, b) => a - b);
  const combos = enumerateFourCombos(sortedPool);

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
