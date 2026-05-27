import type { StrategyRecommendation } from '../../types/stratEval';

/** ?Â·í•˜ ?„ëµ?ì„œ ?˜ì˜¨ ë²ˆí˜¸?€ ?ìˆ˜ë¥????€???©ì³, ?´í›„ 4ê°?ì¡°í•©??ê³ ë? ?¬ë£Œë¥?ë§Œë“ ?? */

export function mergeStrategyRecScores(
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
