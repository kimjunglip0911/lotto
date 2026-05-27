import type { ChiSquareResult } from '../../types';

const relativeDeviationPercent = (r: ChiSquareResult): number | null => {
  if (r.expected <= 0) return null;
  return (r.deviation / r.expected) * 100;
};

/** §2: [-10,0), [0,+10] (0은 양쪽 중 양 구간만). 본번호 6개 기준 배타 분류. */
export const classifyDrawExclusiveBucket = (
  main: readonly number[],
  resultsByNumber: Map<number, ChiSquareResult>,
): 'neg' | 'pos' | 'out' => {
  let hasNeg = false;
  let hasPos = false;
  for (const num of main) {
    const r = resultsByNumber.get(num);
    if (!r) continue;
    const p = relativeDeviationPercent(r);
    if (p === null) continue;
    if (p >= -10 && p < 0) hasNeg = true;
    else if (p >= 0 && p <= 10) hasPos = true;
  }
  if (hasNeg) return 'neg';
  if (hasPos) return 'pos';
  return 'out';
};
