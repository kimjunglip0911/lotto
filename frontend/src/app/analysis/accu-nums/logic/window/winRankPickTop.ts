import type { AccumulatedStrategyKey, StrategyTopWindow, StrategyWindowMetrics } from '../../types/stratEval';
import { toAtLeastOneRate, toAvgHits } from './winRankMetrics';

/** ?¬ëŸ¬ ?ˆë„ ê¸¸ì´ ì¤? ê³¼ê±° ë°±í…Œ?¤íŠ¸ ì§€?œê? ì¢‹ì? ?œìœ¼ë¡??„ëžµë³??ìœ„ Nê°??ˆë„ë¥?ê³ ë¥¸?? */
export function pickTopWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  topN: number,
  options?: { minWindowSize?: number; maxWindowSize?: number }
): StrategyTopWindow[] {
  const rows = aggregates
    .filter((a) => {
      if (a.strategy !== strategy || a.evaluatedRounds <= 0) return false;
      if (options?.minWindowSize !== undefined && a.windowSize < options.minWindowSize) return false;
      if (options?.maxWindowSize !== undefined && a.windowSize > options.maxWindowSize) return false;
      return true;
    })
    .sort((a, b) => {
      const rateDiff = toAtLeastOneRate(b) - toAtLeastOneRate(a);
      if (rateDiff !== 0) return rateDiff;
      const avgDiff = toAvgHits(b) - toAvgHits(a);
      if (avgDiff !== 0) return avgDiff;
      return a.windowSize - b.windowSize;
    })
    .slice(0, topN);

  return rows.map((a) => ({
    strategy: a.strategy,
    windowSize: a.windowSize,
    atLeastOneRate: toAtLeastOneRate(a),
    avgHits: toAvgHits(a),
    maxMissStreak: a.maxMissStreak,
  }));
}
