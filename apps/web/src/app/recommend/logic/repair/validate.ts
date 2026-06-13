import { numberToBandIndex } from '@/app/combination/logic/numberToBand';
import type { ProfileConstraints, SetViolation, ValidateResult } from '@/app/recommend/logic/repair/types';
import { matchesBandTarget } from '@/app/recommend/logic/repair/bandFallback';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';

/** 뽑은 6개가 합·band 제약을 만족하는지 검사한다 */

export const validatePickedSet = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult => {
  const violations: SetViolation[] = [];
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] };
  if (new Set(picked).size !== 6) violations.push('duplicate');
  for (let i = 0; i < 6; i++) {
    if (!matchesBandTarget(constraints.bandTargets[i]!, numberToBandIndex(picked[i]!))) {
      violations.push('band');
      break;
    }
  }
  const sorted = sortPickedAsc(picked);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum > constraints.maxSum) violations.push('sum_high');
  if (sum < constraints.minSum) violations.push('sum_low');
  return { ok: violations.length === 0, violations };
};

export const validateSet = (
  sorted: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult => validatePickedSet(sorted, constraints);

export const validateMetricsOnly = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult => {
  const violations: SetViolation[] = [];
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] };
  if (new Set(picked).size !== 6) violations.push('duplicate');
  const sorted = sortPickedAsc(picked);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum > constraints.maxSum) violations.push('sum_high');
  if (sum < constraints.minSum) violations.push('sum_low');
  return { ok: violations.length === 0, violations };
};

export const validatePickedNoSum = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): ValidateResult => {
  const violations: SetViolation[] = [];
  if (picked.length !== 6) return { ok: false, violations: ['duplicate'] };
  if (new Set(picked).size !== 6) violations.push('duplicate');
  for (let i = 0; i < 6; i++) {
    if (!matchesBandTarget(constraints.bandTargets[i]!, numberToBandIndex(picked[i]!))) {
      violations.push('band');
      break;
    }
  }
  return { ok: violations.length === 0, violations };
};

export const hasFallbackBandOk = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): boolean => validatePickedNoSum(picked, constraints).ok;

export const hasFallbackMetricOk = hasFallbackBandOk;
export const hasFallbackBothMetricsOk = hasFallbackBandOk;
