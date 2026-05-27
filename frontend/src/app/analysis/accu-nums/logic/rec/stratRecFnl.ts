import type { FinalNumberSelection, StrategyRecommendation } from '../../types/stratEval';
import { pickBestFinalFourPair } from './stratRecFnlPick';

/** ? ?? ??? ?? ?? 4? ????? ?? ??? ???. */
export const buildFinalNumberSelection = (
  strategyA: StrategyRecommendation,
  strategyB: StrategyRecommendation,
): FinalNumberSelection => {
  const { commonNumbers, finalNumbers } = pickBestFinalFourPair(strategyA, strategyB);
  return { strategyA, strategyB, commonNumbers, finalNumbers };
};
