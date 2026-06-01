import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';
import type { ProfileConstraints, SetViolation, ValidateResult } from '@/app/recommend/logic/repair/types';
import { matchesBandTarget } from '@/app/recommend/logic/repair/bandFallback';
import { maxConsecutiveRunLength, sortPickedAsc } from '@/app/recommend/logic/repair/runLen';

/** 뽑은 6개가 합·홀짝·연속·band 제약을 만족하는지 검사한다 */

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
  const evens = sorted.filter((n) => n % 2 === 0).length;
  if (evens !== constraints.evenT) violations.push('even');
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run');
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
  const evens = sorted.filter((n) => n % 2 === 0).length;
  if (evens !== constraints.evenT) violations.push('even');
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run');
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
  const sorted = sortPickedAsc(picked);
  const evens = sorted.filter((n) => n % 2 === 0).length;
  if (evens !== constraints.evenT) violations.push('even');
  if (maxConsecutiveRunLength(sorted) !== constraints.runT) violations.push('run');
  return { ok: violations.length === 0, violations };
};

export const hasFallbackBothMetricsOk = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): boolean => {
  const sorted = sortPickedAsc(picked);
  const evens = sorted.filter((n) => n % 2 === 0).length;
  const run = maxConsecutiveRunLength(sorted);
  return evens === constraints.evenT && run === constraints.runT;
};

export const hasFallbackMetricOk = (
  picked: readonly number[],
  constraints: ProfileConstraints,
): boolean => {
  const sorted = sortPickedAsc(picked);
  const evens = sorted.filter((n) => n % 2 === 0).length;
  const run = maxConsecutiveRunLength(sorted);
  return evens === constraints.evenT || run === constraints.runT;
};
