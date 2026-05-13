import type { FinalNumberSelection, StrategyRecommendation } from '../types';
import { pickBestFinalFourPair } from './stratRecCombo';

/** 상·하 두 추천을 합쳐 화면에 보여 줄 “최종 4개” 한 벌을 만든다(공통 우선·점수 보조). */

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
