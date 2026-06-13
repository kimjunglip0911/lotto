import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** rank 슬롯 순서·전략 라벨 */

const COMBO_STRATEGY_RE = /^combo:rank(\d+)$/;

const comboStrategyForRank = (rank: number): string => `combo:rank${rank}`;

export const formatProfileRank = (rank: number): string => `rank${rank}`;

/** @deprecated formatProfileRank 사용 */
export const formatProfilePair = (_oe: number, band: number): string => formatProfileRank(band);

/** @deprecated formatProfileRank 사용 */
export const formatProfileTriple = (_oe: number, _run: number, band: number): string =>
  formatProfileRank(band);

const fallbackStrategyForRank = (rank: number): string =>
  `${FALLBACK_STRATEGY_PREFIX}${formatProfileRank(rank)}`;

export const parseComboStrategyRank = (strategy: string | undefined): number => {
  if (!strategy) return 999;
  const m = COMBO_STRATEGY_RE.exec(strategy);
  if (m) return Number(m[1]);
  const fb = new RegExp(`^${FALLBACK_STRATEGY_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}rank(\\d+)$`).exec(
    strategy,
  );
  if (fb) return Number(fb[1]);
  return 999;
};

/** @deprecated parseComboStrategyRank 사용 */
export const parseComboStrategyRanks = (strategy: string | undefined): [number, number] => {
  const rank = parseComboStrategyRank(strategy);
  return [rank, rank];
};

export const sortGeneratedSetsByComboStrategy = (sets: readonly GeneratedSet[]): GeneratedSet[] =>
  [...sets].sort((x, y) => {
    const a = parseComboStrategyRank(x.strategy);
    const b = parseComboStrategyRank(y.strategy);
    if (a !== b) return a - b;
    const key = (s: GeneratedSet) =>
      [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((p, q) => p - q).join(',');
    return key(x).localeCompare(key(y));
  });

export const orderSetsByProfileSlots = (sets: readonly GeneratedSet[]): GeneratedSet[] => {
  const remaining = [...sets];
  const ordered: GeneratedSet[] = [];
  for (const rank of COMBO_RANK_SLOT_ORDER) {
    const want = comboStrategyForRank(rank);
    const wantFallback = fallbackStrategyForRank(rank);
    let idx = remaining.findIndex((s) => s.strategy === want);
    if (idx < 0) idx = remaining.findIndex((s) => s.strategy === wantFallback);
    if (idx < 0) continue;
    ordered.push(remaining[idx]!);
    remaining.splice(idx, 1);
  }
  return [...ordered, ...remaining];
};

export const setsInProfileSlotOrder = (slots: readonly (GeneratedSet | null)[]): GeneratedSet[] => {
  const out: GeneratedSet[] = [];
  for (const s of slots) {
    if (s) out.push(s);
  }
  return out;
};
