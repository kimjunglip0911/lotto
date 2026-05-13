/** 두 전략 추천을 합쳐 최종 4개(공통 우선·제약 만족 조합)를 만든다. */

import type { FinalNumberSelection, StrategyRecommendation } from './types';
import { pickBestFinalFourPair } from './stratRecPool';

/** 공통번호 우선, 부족분은 점수(높은 순)로 채워 최종 4개를 만든다. */
export function buildFinalNumberSelection(
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation
): FinalNumberSelection {
  const { commonNumbers, finalNumbers } = pickBestFinalFourPair(strategyA, strategyB);
  return {
    strategyA,
    strategyB,
    commonNumbers,
    finalNumbers,
  };
}
