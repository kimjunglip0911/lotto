import { MAX_REPAIR_STEPS, PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { canPickBandSkeleton } from '@/app/recommend/logic/repair/backtrack';
import { randomPerPositionPick } from '@/app/recommend/logic/repair/pick';
import { buildMetricsOnlyFromPool } from '@/app/recommend/logic/repair/metricsOnly';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';
import { repairOneStep } from '@/app/recommend/logic/repair/repairStep';
import { repairFallbackUntil, tryFallbackFromBases } from '@/app/recommend/logic/repair/repairFallback';
import { sequentialPickByBands } from '@/app/recommend/logic/repair/sequentialPick';

/** PROFILE_BUILD_ATTEMPTS회 시도 후 폴백 */

export const buildOneSetWithFallback = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx = {},
  maxAttempts: number = PROFILE_BUILD_ATTEMPTS,
): { picked: number[]; usedFallback: boolean } | null => {
  const sequential = sequentialPickByBands(
    poolByBand,
    constraints.bandTargets,
    constraints.minSum,
    constraints.maxSum,
    pickCtx,
    constraints.bandLadder,
  );
  if (sequential) return { picked: sequential, usedFallback: false };

  if (!canPickBandSkeleton(poolByBand, constraints.bandTargets, pickCtx)) {
    const metricsOnly = buildMetricsOnlyFromPool(
      poolByBand,
      constraints,
      pickCtx,
      maxAttempts * 2,
    );
    if (metricsOnly) return { picked: metricsOnly, usedFallback: true };
  }

  let firstDraw: number[] | null = null;
  const attemptDraws: number[][] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const picked = randomPerPositionPick(
      poolByBand,
      constraints.bandTargets,
      pickCtx,
      constraints.bandLadder,
    );
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
    if (state.ok) return { picked: [...work], usedFallback: false };
  }

  const fallbackBases = firstDraw ? [[...firstDraw], ...attemptDraws] : attemptDraws;
  const fromBases = tryFallbackFromBases(fallbackBases, poolByBand, constraints, pickCtx);
  if (fromBases) return { picked: fromBases, usedFallback: true };

  for (let extra = 0; extra < maxAttempts; extra++) {
    const picked = randomPerPositionPick(
      poolByBand,
      constraints.bandTargets,
      pickCtx,
      constraints.bandLadder,
    );
    if (!picked) continue;
    const work = [...picked];
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'both')) {
      return { picked: [...work], usedFallback: true };
    }
    if (repairFallbackUntil(work, constraints, poolByBand, pickCtx, 'one')) {
      return { picked: [...work], usedFallback: true };
    }
  }

  const metricsOnly = buildMetricsOnlyFromPool(
    poolByBand,
    constraints,
    pickCtx,
    maxAttempts * 2,
  );
  if (metricsOnly) return { picked: metricsOnly, usedFallback: true };
  return null;
};
