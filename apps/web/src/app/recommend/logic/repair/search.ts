import {
  MAX_FORCE_REPAIR_STEPS,
  MAX_STOCHASTIC_REPAIR_STEPS,
} from '@/app/recommend/constants/repairLimits';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { compareViolationSets, violationScore } from '@/app/recommend/logic/repair/violation';
import { replaceCandidatesForPosition } from '@/app/recommend/logic/repair/repairPos';
import { pickDiverseOne } from '@/app/recommend/logic/repair/diverse';
import { validatePickedSet } from '@/app/recommend/logic/repair/validate';
import { repairOneStep } from '@/app/recommend/logic/repair/repairStep';

/** 강제·BFS·확률적 교체 탐색 */

export const aggressiveRepairUntilOk = (
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
): boolean => {
  let state = validatePickedSet(picked, constraints);
  if (state.ok) return true;
  for (let step = 0; step < MAX_FORCE_REPAIR_STEPS; step++) {
    if (state.ok) return true;
    let progressed = false;
    for (let pos = 0; pos < 6; pos++) {
      const candidates = replaceCandidatesForPosition(
        picked,
        pos,
        poolByBand,
        constraints.bandTargets,
        pickCtx,
      );
      for (const n of candidates) {
        const prev = picked[pos]!;
        picked[pos] = n;
        const next = validatePickedSet(picked, constraints);
        if (next.ok || compareViolationSets(next.violations, state.violations) <= 0) {
          state = next;
          progressed = true;
          if (state.ok) return true;
          break;
        }
        picked[pos] = prev;
      }
    }
    if (!progressed && repairOneStep(picked, state, constraints, poolByBand, pickCtx)) {
      state = validatePickedSet(picked, constraints);
      progressed = true;
      if (state.ok) return true;
    }
    if (!progressed) break;
  }
  return validatePickedSet(picked, constraints).ok;
};

export const bfsRepairUntilOk = (
  startPicked: readonly number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  maxVisits: number,
): number[] | null => {
  const queue: number[][] = [[...startPicked]];
  const seen = new Set<string>([startPicked.join(',')]);
  while (queue.length > 0 && seen.size < maxVisits) {
    const cur = queue.shift()!;
    const state = validatePickedSet(cur, constraints);
    if (state.ok) return [...cur];
    for (let pos = 0; pos < 6; pos++) {
      const candidates = replaceCandidatesForPosition(
        cur,
        pos,
        poolByBand,
        constraints.bandTargets,
        pickCtx,
      );
      for (const n of candidates) {
        const next = [...cur];
        next[pos] = n;
        const key = next.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return null;
};

export const stochasticRepairUntilOk = (
  picked: number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
): boolean => {
  let state = validatePickedSet(picked, constraints);
  if (state.ok) return true;
  let bestScore = violationScore(state.violations);
  const best = [...picked];
  for (let step = 0; step < MAX_STOCHASTIC_REPAIR_STEPS; step++) {
    state = validatePickedSet(picked, constraints);
    if (state.ok) return true;
    const pos = step % 6;
    const candidates = replaceCandidatesForPosition(
      picked,
      pos,
      poolByBand,
      constraints.bandTargets,
      pickCtx,
    );
    if (candidates.length === 0) continue;
    const pick = pickDiverseOne(candidates, pickCtx) ?? candidates[0]!;
    const prev = picked[pos]!;
    picked[pos] = pick;
    const next = validatePickedSet(picked, constraints);
    const nextScore = violationScore(next.violations);
    if (next.ok) return true;
    if (nextScore <= bestScore || Math.random() < 0.12) {
      bestScore = nextScore;
      best.splice(0, 6, ...picked);
      state = next;
    } else {
      picked[pos] = prev;
    }
  }
  picked.splice(0, 6, ...best);
  return validatePickedSet(picked, constraints).ok;
};
