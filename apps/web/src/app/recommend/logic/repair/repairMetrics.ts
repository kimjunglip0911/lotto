import { MAX_REPAIR_STEPS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx, ValidateResult } from '@/app/recommend/logic/repair/types';
import { compareViolationSets } from '@/app/recommend/logic/repair/violation';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { pickRepairPosition, replaceCandidatesFromFullPool } from '@/app/recommend/logic/repair/repairPos';
import { validateMetricsOnly } from '@/app/recommend/logic/repair/validate';

/** band 없이 합만 맞추는 교체 */

const repairMetricsOneStep = (
  picked: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): boolean => {
  if (before.ok) return false;
  const pos = pickRepairPosition(picked, before.violations, constraints.bandTargets);
  const candidates = replaceCandidatesFromFullPool(picked, pos, flatPool, pickCtx);
  const sortedBefore = sortPickedAsc(picked);
  const sumBefore = sortedBefore.reduce((a, b) => a + b, 0);

  for (const n of candidates) {
    const prev = picked[pos]!;
    picked[pos] = n;
    const after = validateMetricsOnly(picked, constraints);
    const sortedAfter = sortPickedAsc(picked);
    const sumAfter = sortedAfter.reduce((a, b) => a + b, 0);
    const sumCloser =
      (before.violations.includes('sum_high') && sumAfter < sumBefore) ||
      (before.violations.includes('sum_low') && sumAfter > sumBefore);
    if (after.ok || compareViolationSets(after.violations, before.violations) < 0 || sumCloser) {
      return true;
    }
    picked[pos] = prev;
  }
  return false;
};

export const repairUntilMetricsOk = (
  picked: number[],
  constraints: ProfileConstraints,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): boolean => {
  if (validateMetricsOnly(picked, constraints).ok) return true;
  for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
    if (validateMetricsOnly(picked, constraints).ok) return true;
    const state = validateMetricsOnly(picked, constraints);
    if (!repairMetricsOneStep(picked, state, constraints, flatPool, pickCtx)) break;
  }
  return validateMetricsOnly(picked, constraints).ok;
};
