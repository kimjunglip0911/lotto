import { MAX_REPAIR_STEPS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx, ValidateResult } from '@/app/recommend/logic/repair/types';
import { compareViolationSets } from '@/app/recommend/logic/repair/violation';
import { maxConsecutiveRunLength, sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { pickRepairPosition, replaceCandidatesFromFullPool } from '@/app/recommend/logic/repair/repairPos';
import { validateMetricsOnly } from '@/app/recommend/logic/repair/validate';

/** band 없이 합·홀짝·연속만 맞추는 교체 */

const repairMetricsOneStep = (
  picked: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): boolean => {
  if (before.ok) return false;
  const pos = pickRepairPosition(
    picked,
    before.violations,
    constraints.evenT,
    constraints.runT,
    constraints.bandTargets,
  );
  const candidates = replaceCandidatesFromFullPool(picked, pos, flatPool, pickCtx);
  const sortedBefore = sortPickedAsc(picked);
  const sumBefore = sortedBefore.reduce((a, b) => a + b, 0);
  const evensBefore = sortedBefore.filter((x) => x % 2 === 0).length;
  const runBefore = maxConsecutiveRunLength(sortedBefore);

  for (const n of candidates) {
    const prev = picked[pos]!;
    picked[pos] = n;
    const after = validateMetricsOnly(picked, constraints);
    const sortedAfter = sortPickedAsc(picked);
    const sumAfter = sortedAfter.reduce((a, b) => a + b, 0);
    const evensAfter = sortedAfter.filter((x) => x % 2 === 0).length;
    const runAfter = maxConsecutiveRunLength(sortedAfter);
    const sumCloser =
      (before.violations.includes('sum_high') && sumAfter < sumBefore) ||
      (before.violations.includes('sum_low') && sumAfter > sumBefore);
    const evenCloser =
      before.violations.includes('even') &&
      Math.abs(evensAfter - constraints.evenT) < Math.abs(evensBefore - constraints.evenT);
    const runCloser =
      before.violations.includes('run') &&
      Math.abs(runAfter - constraints.runT) < Math.abs(runBefore - constraints.runT);
    if (
      after.ok ||
      compareViolationSets(after.violations, before.violations) < 0 ||
      sumCloser ||
      evenCloser ||
      runCloser
    ) {
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
