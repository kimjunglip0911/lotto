import { pickAdaptiveWindowsByStrategy, pickTopWindowsByStrategy } from './strategyEvaluation/winRank';
import type { StrategyTopWindow, StrategyWindowMetrics } from './strategyEvaluation/types';

/**
 * UI·추천과 동일: 평균근접(nearestMean4) 단기 2윈도 + 상2하2(twoHotTwoCold) 장기 2윈도를 고른다.
 * 적응형 후보가 부족하면 상위 고정 랭킹으로 폴백한다.
 */
export function pickFocusStrategyTopWindows(aggregates: StrategyWindowMetrics[]): {
  shortTop: StrategyTopWindow[];
  longTop: StrategyTopWindow[];
} {
  const shortTopRaw = pickAdaptiveWindowsByStrategy(aggregates, 'nearestMean4', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
  });
  const longTopRaw = pickAdaptiveWindowsByStrategy(aggregates, 'twoHotTwoCold', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
    minWindowSize: 240,
  });
  const shortTop =
    shortTopRaw.length >= 2 ? shortTopRaw : pickTopWindowsByStrategy(aggregates, 'nearestMean4', 2);
  const longTop =
    longTopRaw.length >= 2
      ? longTopRaw
      : pickTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 2, { minWindowSize: 240 });

  return { shortTop, longTop };
}
