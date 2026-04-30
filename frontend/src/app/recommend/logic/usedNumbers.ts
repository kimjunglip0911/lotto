import type { WinningHistoryRow } from '@/app/recommend/logic/types'
import {
  BACKTEST_FOCUS_STRATEGY_KEYS,
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
  getDefaultBacktestWindowSizes,
  pickAdaptiveWindowsByStrategy,
  pickTopWindowsByStrategy,
  runAccumulatedNumbersBacktest,
} from '@/app/analysis/accumulated-numbers/logic/backtestEngine'

const EXTENDED_WINDOW_MAX = 1208

export function deriveUsedNumbers(drawNo: number, allHistoryRows: WinningHistoryRow[]): number[] {
  if (!Number.isInteger(drawNo) || drawNo <= 1) return []

  const rowsBeforeTarget = allHistoryRows
    .filter((row) => row.draw_no < drawNo)
    .sort((a, b) => a.draw_no - b.draw_no)

  const drawNumbersToEvaluate = rowsBeforeTarget.map((row) => row.draw_no).filter((value) => value >= 100)
  if (drawNumbersToEvaluate.length === 0) return []

  const { aggregates } = runAccumulatedNumbersBacktest({
    allRowsSortedAsc: rowsBeforeTarget,
    drawNumbersToEvaluate,
    windowSizes: getDefaultBacktestWindowSizes({ maxWindowSize: EXTENDED_WINDOW_MAX }),
    strategyKeys: BACKTEST_FOCUS_STRATEGY_KEYS,
  })

  const shortTopRaw = pickAdaptiveWindowsByStrategy(aggregates, 'nearestMean4', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
  })
  const longTopRaw = pickAdaptiveWindowsByStrategy(aggregates, 'twoHotTwoCold', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
    minWindowSize: 240,
  })

  const shortTop = shortTopRaw.length >= 2 ? shortTopRaw : pickTopWindowsByStrategy(aggregates, 'nearestMean4', 2)
  const longTop =
    longTopRaw.length >= 2
      ? longTopRaw
      : pickTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 2, { minWindowSize: 240 })

  const shortRecommendations = shortTop
    .map((top) => {
      const aggregate = aggregates.find((item) => item.strategy === 'nearestMean4' && item.windowSize === top.windowSize)
      if (!aggregate) return null
      return buildStrategyRecommendation({
        strategy: 'nearestMean4',
        windowSize: top.windowSize,
        allRowsBeforeSelectedDraw: rowsBeforeTarget,
        aggregate,
      })
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const longRecommendations = longTop
    .map((top) => {
      const aggregate = aggregates.find((item) => item.strategy === 'twoHotTwoCold' && item.windowSize === top.windowSize)
      if (!aggregate) return null
      return buildStrategyRecommendation({
        strategy: 'twoHotTwoCold',
        windowSize: top.windowSize,
        allRowsBeforeSelectedDraw: rowsBeforeTarget,
        aggregate,
      })
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const shortRecommendation = combineStrategyRecommendations(shortRecommendations)
  const longRecommendation = combineStrategyRecommendations(longRecommendations)
  if (!shortRecommendation || !longRecommendation) return []

  return buildFinalNumberSelection(shortRecommendation, longRecommendation).finalNumbers
}
