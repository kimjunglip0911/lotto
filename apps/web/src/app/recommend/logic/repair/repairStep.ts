import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';
import type {
  ProfileConstraints,
  RepairPickCtx,
  RepairStepOptions,
  ValidateResult,
} from '@/app/recommend/logic/repair/types';
import { compareViolationSets } from '@/app/recommend/logic/repair/violation';
import { maxConsecutiveRunLength, sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { pickRepairPosition, replaceCandidatesForPosition } from '@/app/recommend/logic/repair/repairPos';
import { validatePickedNoSum, validatePickedSet } from '@/app/recommend/logic/repair/validate';

/** 한 자리 교체로 위반을 줄인다 */

export const repairOneStep = (
  picked: number[],
  before: ValidateResult,
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  options?: RepairStepOptions,
): boolean => {
  if (before.ok) return false;
  const ignoreSum = options?.ignoreSum === true;
  const pos = pickRepairPosition(
    picked,
    before.violations,
    constraints.evenT,
    constraints.runT,
    constraints.bandTargets,
  );
  const candidates = replaceCandidatesForPosition(
    picked,
    pos,
    poolByBand,
    constraints.bandTargets,
    pickCtx,
  );
  const sortedBefore = sortPickedAsc(picked);
  const sumBefore = sortedBefore.reduce((a, b) => a + b, 0);
  const evensBefore = sortedBefore.filter((x) => x % 2 === 0).length;
  const runBefore = maxConsecutiveRunLength(sortedBefore);

  for (const n of candidates) {
    const prev = picked[pos]!;
    picked[pos] = n;
    const after = ignoreSum
      ? validatePickedNoSum(picked, constraints)
      : validatePickedSet(picked, constraints);
    const sortedAfter = sortPickedAsc(picked);
    const sumAfter = sortedAfter.reduce((a, b) => a + b, 0);
    const evensAfter = sortedAfter.filter((x) => x % 2 === 0).length;
    const runAfter = maxConsecutiveRunLength(sortedAfter);
    const bandAtPosOk =
      before.violations.includes('band') &&
      numberToBandIndex(n) === constraints.bandTargets[pos];
    const sumCloser =
      !ignoreSum &&
      ((before.violations.includes('sum_high') && sumAfter < sumBefore) ||
        (before.violations.includes('sum_low') && sumAfter > sumBefore));
    const evenCloser =
      before.violations.includes('even') &&
      Math.abs(evensAfter - constraints.evenT) < Math.abs(evensBefore - constraints.evenT);
    const runCloser =
      before.violations.includes('run') &&
      Math.abs(runAfter - constraints.runT) < Math.abs(runBefore - constraints.runT);
    if (
      after.ok ||
      compareViolationSets(after.violations, before.violations) < 0 ||
      bandAtPosOk ||
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
