import { MAX_REPAIR_STEPS, PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { canPickBandSkeleton } from '@/app/recommend/logic/repair/backtrack';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { randomPerPositionPick } from '@/app/recommend/logic/repair/pick';
import { buildMetricsOnlyFromPool } from '@/app/recommend/logic/repair/metricsOnly';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';
import { repairOneStep } from '@/app/recommend/logic/repair/repairStep';
import { repairFallbackUntil, tryFallbackFromBases } from '@/app/recommend/logic/repair/repairFallback';

/** PROFILE_BUILD_ATTEMPTS회 시도 후 폴백 */

export const buildOneSetWithFallback = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx = {},
  maxAttempts: number = PROFILE_BUILD_ATTEMPTS,
): { sorted: number[]; usedFallback: boolean } | null => {
  if (!canPickBandSkeleton(poolByBand, constraints.bandTargets, pickCtx)) {
    const metricsOnly = buildMetricsOnlyFromPool(
      poolByBand,
      constraints,
      pickCtx,
      maxAttempts * 2,
    );
    if (metricsOnly) return { sorted: metricsOnly, usedFallback: true };
  }

  let firstDraw: number[] | null = null;
  const attemptDraws: number[][] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx);
    if (!picked) continue;
    if (!firstDraw) firstDraw = [...picked];
    attemptDraws.push([...picked]);
    const work = [...picked];
    let state = validatePickedSet(work, constraints);
    if (!state.ok) {
      for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
        if (!repairOneStep(work, state, constraints, poolByBand, pickCtx)) break;
        state = validatePickedSet(work, constraints);
        if (state.ok) break;
      }
    }
    if (state.ok) return { sorted: sortPickedAsc(work), usedFallback: false };
  }

  const fallbackBases = firstDraw ? [[...firstDraw], ...attemptDraws] : attemptDraws;
  const fromBases = tryFallbackFromBases(fallbackBases, poolByBand, constraints, pickCtx);
  if (fromBases) return { sorted: fromBases, usedFallback: true };

  for (let extra = 0; extra < maxAttempts; extra++) {
    const picked = randomPerPositionPick(poolByBand, constraints.bandTargets, pickCtx);
    if (!picked) continue;
    const work = [...picked];
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'both')) {
      return { sorted: sortPickedAsc(work), usedFallback: true };
    }
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'one')) {
      return { sorted: sortPickedAsc(work), usedFallback: true };
    }
  }

  const metricsOnly = buildMetricsOnlyFromPool(
    poolByBand,
    constraints,
    pickCtx,
    maxAttempts * 2,
  );
  if (metricsOnly) return { sorted: metricsOnly, usedFallback: true };
  return null;
};
