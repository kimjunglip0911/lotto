import type { AccumulatedStrategyKey, AdaptiveWindowSelectionOptions, StrategyTopWindow, StrategyWindowMetrics } from '../../types/stratEval';
import { pickTopWindowsByStrategy } from './winRankPickTop';

/** ë¹„ìŠ·??ê¸¸ì´???ˆë„ê°€ ê²¹ì¹˜ì§€ ?Šê²Œ ê³¨ë¼, ì§§ì? ê¸°ê°„ê³?ê¸?ê¸°ê°„???žì–´ ?????´ë‹¤. */

const toWindowQualityScore = (row: StrategyTopWindow): number =>
  row.atLeastOneRate * 0.7 + row.avgHits * 0.3 - row.maxMissStreak * 0.006;

/** ?ìœ„ Top-N ?„ë³´ ?€?ì„œ ê°„ê²© ?œì•½(minWindowGap)???ê³  ?™ì ?¼ë¡œ pickCountê°œë? ê³ ë¥¸?? */
export function pickAdaptiveWindowsByStrategy(
  aggregates: StrategyWindowMetrics[],
  strategy: AccumulatedStrategyKey,
  options: AdaptiveWindowSelectionOptions
): StrategyTopWindow[] {
  const { poolSize, pickCount, minWindowGap = 24, minWindowSize, maxWindowSize } = options;
  const pool = pickTopWindowsByStrategy(aggregates, strategy, Math.max(poolSize, pickCount), {
    minWindowSize,
    maxWindowSize,
  });
  const ranked = [...pool].sort((a, b) => {
    const diff = toWindowQualityScore(b) - toWindowQualityScore(a);
    if (diff !== 0) return diff;
    return a.windowSize - b.windowSize;
  });

  const picked: StrategyTopWindow[] = [];
  for (const row of ranked) {
    if (picked.length >= pickCount) break;
    const tooClose = picked.some((p) => Math.abs(p.windowSize - row.windowSize) < minWindowGap);
    if (!tooClose) {
      picked.push(row);
    }
  }
  if (picked.length < pickCount) {
    for (const row of ranked) {
      if (picked.length >= pickCount) break;
      if (!picked.some((p) => p.windowSize === row.windowSize)) {
        picked.push(row);
      }
    }
  }
  return picked;
}
