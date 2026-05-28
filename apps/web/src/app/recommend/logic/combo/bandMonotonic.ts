import { BAND_COUNT } from '@/app/analysis/combination/constants/bandLabels';

/** 자리별 band 목표가 단조 증가하는지 검사하고, 필요 시 보정한다 */

const MAX_BAND_INDEX = BAND_COUNT - 1;

export const areBandTargetsMonotonic = (bandTargets: readonly number[]): boolean => {
  for (let i = 1; i < bandTargets.length; i++) {
    if (bandTargets[i]! < bandTargets[i - 1]!) return false;
  }
  return true;
};

export const makeMonotonicBandTargets = (raw: readonly number[]): number[] => {
  const out = [...raw];
  for (let i = 1; i < out.length; i++) {
    if (out[i]! < out[i - 1]!) out[i] = out[i - 1]!;
  }
  return out;
};

export const differentiateBandTargetsFromPrev = (
  targets: readonly number[],
  prev: readonly number[],
): number[] => {
  const out = [...targets];
  const same = out.length === prev.length && out.every((v, i) => v === prev[i]);
  if (!same) return out;
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i]! < MAX_BAND_INDEX) {
      out[i] = out[i]! + 1;
      return out;
    }
  }
  return out;
};
