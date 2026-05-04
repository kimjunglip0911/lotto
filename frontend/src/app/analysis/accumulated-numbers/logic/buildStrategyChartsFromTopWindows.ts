import { buildNumberCounts } from './numberCounts';
import { sliceWindowTail } from './strategyEvaluation/windowSlice';
import type { StrategyChartData, WinningNumberRow } from '../types';
import type { StrategyTopWindow } from './strategyEvaluation/types';

/** 집계 기반 상위 윈도 목록으로 전략 차트용 데이터를 만든다. */
export function buildStrategyChartsFromTopWindows(
  rangeRowsSortedAsc: WinningNumberRow[],
  shortTop: StrategyTopWindow[],
  longTop: StrategyTopWindow[]
): StrategyChartData[] {
  return [...shortTop, ...longTop].map((w, idx) => {
    const nearestIndex = shortTop.findIndex((v) => v.windowSize === w.windowSize && v.strategy === w.strategy);
    const twoHotIndex = longTop.findIndex((v) => v.windowSize === w.windowSize && v.strategy === w.strategy);
    const rank = w.strategy === 'nearestMean4' ? nearestIndex + 1 : twoHotIndex + 1;
    const rows = sliceWindowTail(rangeRowsSortedAsc, w.windowSize);
    return {
      key: `${w.strategy}-${w.windowSize}-${idx}`,
      title:
        w.strategy === 'nearestMean4'
          ? `평균근접 전략 추천 기간 ${rank} (이전 ${w.windowSize}회)`
          : `상2+하2 전략 추천 기간 ${rank} (이전 ${w.windowSize}회)`,
      counts: buildNumberCounts(rows),
      analyzedDrawCount: rows.length,
      noDataMessage: `이전 ${w.windowSize}회 데이터가 부족해 전략 차트를 표시할 수 없습니다.`,
      strategyLabel: w.strategy === 'nearestMean4' ? '평균근접' : '상2+하2',
      windowSize: w.windowSize,
      atLeastOneRate: w.atLeastOneRate,
      avgHits: w.avgHits,
      maxMissStreak: w.maxMissStreak,
    };
  });
}
