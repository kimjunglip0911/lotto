import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** 프로필 슬롯 순서·전략 라벨 */

const COMBO_STRATEGY_RE = /^combo:oe(\d+)-band(\d+)$/;

const comboStrategyForPair = (oe: number, band: number): string => `combo:oe${oe}-band${band}`;

export const formatProfilePair = (oe: number, band: number): string => `oe${oe}-band${band}`;

/** @deprecated formatProfilePair 사용 */
export const formatProfileTriple = (oe: number, _run: number, band: number): string =>
  formatProfilePair(oe, band);

const fallbackStrategyForPair = (oe: number, band: number): string =>
  `${FALLBACK_STRATEGY_PREFIX}${formatProfilePair(oe, band)}`;

export const parseComboStrategyRanks = (strategy: string | undefined): [number, number] => {
  if (!strategy) return [999, 999];
  const m = COMBO_STRATEGY_RE.exec(strategy);
  if (!m) return [999, 999];
  return [Number(m[1]), Number(m[2])];
};

export const sortGeneratedSetsByComboStrategy = (sets: readonly GeneratedSet[]): GeneratedSet[] =>
  [...sets].sort((x, y) => {
    const [a1, a2] = parseComboStrategyRanks(x.strategy);
    const [b1, b2] = parseComboStrategyRanks(y.strategy);
    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;
    const key = (s: GeneratedSet) =>
      [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((a, b) => a - b).join(',');
    return key(x).localeCompare(key(y));
  });

export const orderSetsByProfileSlots = (sets: readonly GeneratedSet[]): GeneratedSet[] => {
  const remaining = [...sets];
  const ordered: GeneratedSet[] = [];
  for (const [oe, band] of COMBO_PROFILE_SLOT_ORDER) {
    const want = comboStrategyForPair(oe, band);
    const wantFallback = fallbackStrategyForPair(oe, band);
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
