import type { StrategyRecommendation } from '../types/stratEval';
import type { StrategyNumberPick } from '../types';

/** 네 전략 추천 결과를 UI·스냅샷용 strategyPicks 배열로 묶는다. */
export const buildStrategyNumberPicks = (
  twoYearSize: number,
  fullWindowSize: number,
  recTop2y: StrategyRecommendation,
  recBot2y: StrategyRecommendation,
  recTopFull: StrategyRecommendation,
  recBotFull: StrategyRecommendation,
): StrategyNumberPick[] => [
  {
    strategyKey: 'top4TwoYear',
    strategyLabel: '상위 출현 4 (2년, 104회차)',
    windowSizes: [twoYearSize],
    numbers: recTop2y.numbers,
    atLeastOneRate: recTop2y.metrics.atLeastOneRate,
    avgHits: recTop2y.metrics.avgHits,
    maxMissStreak: recTop2y.metrics.maxMissStreak,
  },
  {
    strategyKey: 'bottom4TwoYear',
    strategyLabel: '하위 출현 4 (2년, 104회차)',
    windowSizes: [twoYearSize],
    numbers: recBot2y.numbers,
    atLeastOneRate: recBot2y.metrics.atLeastOneRate,
    avgHits: recBot2y.metrics.avgHits,
    maxMissStreak: recBot2y.metrics.maxMissStreak,
  },
  {
    strategyKey: 'top4Full',
    strategyLabel: '상위 출현 4 (전체 기간)',
    windowSizes: [fullWindowSize],
    numbers: recTopFull.numbers,
    atLeastOneRate: recTopFull.metrics.atLeastOneRate,
    avgHits: recTopFull.metrics.avgHits,
    maxMissStreak: recTopFull.metrics.maxMissStreak,
  },
  {
    strategyKey: 'bottom4Full',
    strategyLabel: '하위 출현 4 (전체 기간)',
    windowSizes: [fullWindowSize],
    numbers: recBotFull.numbers,
    atLeastOneRate: recBotFull.metrics.atLeastOneRate,
    avgHits: recBotFull.metrics.avgHits,
    maxMissStreak: recBotFull.metrics.maxMissStreak,
  },
];
