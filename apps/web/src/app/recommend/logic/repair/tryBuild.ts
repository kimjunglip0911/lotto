import { MAX_REPAIR_STEPS, MAX_SEED_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { randomPerPositionPick } from '@/app/recommend/logic/repair/pick';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';
import { repairOneStep } from '@/app/recommend/logic/repair/repairStep';

/** 랜덤 시드·교체로 한 세트 */

export const tryBuildOneSet = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
): number[] | null => {
  for (let attempt = 0; attempt < MAX_SEED_ATTEMPTS; attempt++) {
    const picked = randomPerPositionPick(
      poolByBand,
      constraints.bandTargets,
      pickCtx,
      constraints.bandLadder,
    );
    if (!picked) continue;
    const work = [...picked];
    let state = validatePickedSet(work, constraints);
    if (state.ok) return sortPickedAsc(work);
    for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
      if (!repairOneStep(work, state, constraints, poolByBand, pickCtx)) break;
      state = validatePickedSet(work, constraints);
      if (state.ok) return sortPickedAsc(work);
    }
  }
  return null;
};
