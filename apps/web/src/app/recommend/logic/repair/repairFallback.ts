import { MAX_REPAIR_STEPS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import {
  hasFallbackBothMetricsOk,
  hasFallbackMetricOk,
  validatePickedNoSum,
} from '@/app/recommend/logic/repair/validate';
import { repairOneStep } from '@/app/recommend/logic/repair/repairStep';

/** 합 무시·홀짝·연속 폴백 교체 */

export const repairFallbackUntil = (
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  mode: 'both' | 'one',
): boolean => {
  const satisfied = () =>
    mode === 'both'
      ? hasFallbackBothMetricsOk(picked, constraints)
      : hasFallbackMetricOk(picked, constraints);
  if (satisfied()) return true;
  for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
    if (satisfied()) return true;
    const state = validatePickedNoSum(picked, constraints);
    if (!repairOneStep(picked, state, constraints, poolByBand, pickCtx, { ignoreSum: true })) break;
  }
  return satisfied();
};

export const tryFallbackFromBases = (
  bases: readonly (readonly number[])[],
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
): number[] | null => {
  for (const base of bases) {
    const work = [...base];
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'both')) {
      return work.sort((a, b) => a - b);
    }
  }
  for (const base of bases) {
    const work = [...base];
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'one')) {
      return work.sort((a, b) => a - b);
    }
  }
  return null;
};
