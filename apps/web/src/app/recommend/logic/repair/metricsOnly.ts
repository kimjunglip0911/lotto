import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { flatAdoptedPool } from '@/app/recommend/logic/repair/pool';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { pickSixFromFlatPool } from '@/app/recommend/logic/repair/pick';
import { repairUntilMetricsOk } from '@/app/recommend/logic/repair/repairMetrics';

/** band 없이 합·홀짝만 맞춘 6개 */

export const buildMetricsOnlyFromPool = (
  poolByBand: ReadonlyMap<number, number[]>,
  constraints: ProfileConstraints,
  pickCtx: RepairPickCtx,
  maxAttempts: number = PROFILE_BUILD_ATTEMPTS,
): number[] | null => {
  const flat = flatAdoptedPool(poolByBand);
  if (flat.length < 6) return null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const picked = pickSixFromFlatPool(flat, pickCtx);
    if (!picked) continue;
    const work = [...picked];
    if (repairUntilMetricsOk(work, constraints, flat, pickCtx)) {
      return sortPickedAsc(work);
    }
  }
  return null;
};
