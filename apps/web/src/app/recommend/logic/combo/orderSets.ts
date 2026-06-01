import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { FALLBACK_STRATEGY_PREFIX } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** 프로필 슬롯 순서·전략 라벨 */

const COMBO_STRATEGY_RE = /^combo:oe(\d+)-run(\d+)-band(\d+)$/;

const comboStrategyForTriple = (oe: number, run: number, band: number): string =>
  `combo:oe${oe}-run${run}-band${band}`;

export const formatProfileTriple = (oe: number, run: number, band: number): string =>
  `oe${oe}-run${run}-band${band}`;

const fallbackStrategyForTriple = (oe: number, run: number, band: number): string =>
  `${FALLBACK_STRATEGY_PREFIX}${formatProfileTriple(oe, run, band)}`;

export const parseComboStrategyRanks = (strategy: string | undefined): [number, number, number] => {
  if (!strategy) return [999, 999, 999];
  const m = COMBO_STRATEGY_RE.exec(strategy);
  if (!m) return [999, 999, 999];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};

export const sortGeneratedSetsByComboStrategy = (sets: readonly GeneratedSet[]): GeneratedSet[] =>
  [...sets].sort((x, y) => {
    const [a1, a2, a3] = parseComboStrategyRanks(x.strategy);
    const [b1, b2, b3] = parseComboStrategyRanks(y.strategy);
    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;
    if (a3 !== b3) return a3 - b3;
    const key = (s: GeneratedSet) =>
      [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((a, b) => a - b).join(',');
    return key(x).localeCompare(key(y));
  });

export const orderSetsByProfileSlots = (sets: readonly GeneratedSet[]): GeneratedSet[] => {
  const remaining = [...sets];
  const ordered: GeneratedSet[] = [];
  for (const [oe, run, band] of COMBO_PROFILE_SLOT_ORDER) {
    const want = comboStrategyForTriple(oe, run, band);
    const wantFallback = fallbackStrategyForTriple(oe, run, band);
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
