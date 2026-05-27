import type { SetViolation } from '@/app/recommend/logic/repair/types';

/** 위반 집합 비교·점수 */

export const violationRank = (v: SetViolation): number => {
  if (v === 'duplicate' || v === 'band') return 0;
  if (v === 'sum_high' || v === 'sum_low') return 1;
  if (v === 'even') return 2;
  return 3;
};

export const compareViolationSets = (a: readonly SetViolation[], b: readonly SetViolation[]): number => {
  if (a.length !== b.length) return a.length - b.length;
  const rankA = Math.min(...a.map(violationRank));
  const rankB = Math.min(...b.map(violationRank));
  return rankA - rankB;
};

export const violationScore = (violations: readonly SetViolation[]): number => {
  let score = violations.length * 10;
  for (const v of violations) {
    score += 4 - violationRank(v);
  }
  return score;
};
