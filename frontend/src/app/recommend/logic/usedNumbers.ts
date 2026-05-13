import { pickFocusStrategyTopWindows } from '@/app/analysis/accu-nums/logic/pickTopWin'
import type { WinningHistoryRow } from '@/app/recommend/logic/types'
import {
  ACCUMULATED_FOCUS_STRATEGY_KEYS,
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
  getDefaultEvaluationWindowSizes,
  runAccumulatedStrategyEvaluation,
} from '@/app/analysis/accu-nums/logic/stratEval'

const EXTENDED_WINDOW_MAX = 1208

export function deriveUsedNumbers(drawNo: number, allHistoryRows: WinningHistoryRow[]): number[] {
  if (!Number.isInteger(drawNo) || drawNo <= 1) return []

  const rowsBeforeTarget = allHistoryRows
    .filter((row) => row.draw_no < drawNo)
    .sort((a, b) => a.draw_no - b.draw_no)

  const drawNumbersToEvaluate = rowsBeforeTarget.map((row) => row.draw_no).filter((value) => value >= 100)
  if (drawNumbersToEvaluate.length === 0) return []

  const { aggregates } = runAccumulatedStrategyEvaluation({
    allRowsSortedAsc: rowsBeforeTarget,
    drawNumbersToEvaluate,
    windowSizes: getDefaultEvaluationWindowSizes({ maxWindowSize: EXTENDED_WINDOW_MAX }),
    strategyKeys: ACCUMULATED_FOCUS_STRATEGY_KEYS,
  })

  const { shortTop, longTop } = pickFocusStrategyTopWindows(aggregates)

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
