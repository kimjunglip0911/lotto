/** 기댓값이 이 값 미만이면 편차%가 불안정해 표본에서 제외한다 */
export const MIN_BASELINE = 1e-10;
const BIN_STEP = 1;

const buildInteriorBinDefs = (): readonly { key: string; label: string; lo: number }[] => {
  const defs: { key: string; label: string; lo: number }[] = [];
  for (let lo = -100; lo < 100; lo += BIN_STEP) {
    defs.push({ key: `mid_${lo}`, label: `${lo}~${lo + BIN_STEP}`, lo });
  }
  return defs;
};

const INTERIOR_DEFS = buildInteriorBinDefs();

export const ORDERED_BIN_KEYS: readonly string[] = [
  'tail_low',
  ...INTERIOR_DEFS.map((d) => d.key),
  'tail_high',
];

export const BIN_KEY_TO_LABEL = ((): Map<string, string> => {
  const m = new Map<string, string>();
  m.set('tail_low', '< -100');
  for (const d of INTERIOR_DEFS) m.set(d.key, d.label);
  m.set('tail_high', '≥ 100');
  return m;
})();

export const resolveBinKey = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  const lo = Math.floor(pct / BIN_STEP) * BIN_STEP;
  return `mid_${lo}`;
};
