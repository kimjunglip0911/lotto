import {
  CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE,
  CHI_SQUARE_DEVIATION_BIN_RANGE_MIN,
  CHI_SQUARE_DEVIATION_BIN_WIDTH,
} from '../../constants';

export const DEV_BIN_LT_KEY = 'lt_tail';
export const DEV_BIN_GE_KEY = 'ge_tail';

export const deviationToBinKey = (deviation: number): string => {
  const w = CHI_SQUARE_DEVIATION_BIN_WIDTH;
  const lo = CHI_SQUARE_DEVIATION_BIN_RANGE_MIN;
  const hiEx = CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE;
  if (deviation < lo) return DEV_BIN_LT_KEY;
  if (deviation >= hiEx) return DEV_BIN_GE_KEY;
  const start = Math.floor(deviation / w) * w;
  return `b_${start}`;
};

export const isNegativeDeviationBinKey = (binKey: string): boolean => {
  if (binKey === DEV_BIN_LT_KEY) return true;
  if (binKey === DEV_BIN_GE_KEY) return false;
  if (binKey.startsWith('b_')) {
    const start = Number(binKey.slice(2));
    return Number.isFinite(start) && start < 0;
  }
  return false;
};

export const orderedDeviationBinKeys = (): string[] => {
  const keys: string[] = [DEV_BIN_LT_KEY];
  const w = CHI_SQUARE_DEVIATION_BIN_WIDTH;
  for (let start = CHI_SQUARE_DEVIATION_BIN_RANGE_MIN; start < CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE; start += w) {
    keys.push(`b_${start}`);
  }
  keys.push(DEV_BIN_GE_KEY);
  return keys;
};

export const labelForDeviationBinKey = (key: string): string => {
  const w = CHI_SQUARE_DEVIATION_BIN_WIDTH;
  const lo = CHI_SQUARE_DEVIATION_BIN_RANGE_MIN;
  const hiEx = CHI_SQUARE_DEVIATION_BIN_RANGE_MAX_EXCLUSIVE;
  if (key === DEV_BIN_LT_KEY) return `d < ${lo}`;
  if (key === DEV_BIN_GE_KEY) return `d ≥ ${hiEx}`;
  if (key.startsWith('b_')) {
    const start = Number(key.slice(2));
    return `[${start}, ${start + w})`;
  }
  return key;
};
