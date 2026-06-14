/**
 * 1구간(1번째 자리)부터 6구간 순으로 band 목표 번호를 고른다.
 * 각 단계에서 부분합 + 남은 자리 최소·최대 가능합이 고저 허용 구간과 겹치는 후보만 허용한다.
 */
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { bandRungsForPos, collectBandCands } from '@/app/recommend/logic/repair/bandFallback';
import { flatAdoptedPool } from '@/app/recommend/logic/repair/pool';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';

const sumRangeFeasible = (
  partialSum: number,
  remainingCount: number,
  availSorted: readonly number[],
  minSum: number,
  maxSum: number,
): boolean => {
  if (remainingCount === 0) return partialSum >= minSum && partialSum <= maxSum;
  if (availSorted.length < remainingCount) return false;
  const minRem = availSorted.slice(0, remainingCount).reduce((a, b) => a + b, 0);
  const maxRem = availSorted.slice(-remainingCount).reduce((a, b) => a + b, 0);
  const totalMin = partialSum + minRem;
  const totalMax = partialSum + maxRem;
  return totalMin <= maxSum && totalMax >= minSum;
};

export const sequentialPickByBands = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  minSum: number,
  maxSum: number,
  pickCtx: RepairPickCtx = {},
  bandLadder?: readonly (readonly number[])[],
): number[] | null => {
  if (bandTargets.length !== 6) return null;
  const flat = flatAdoptedPool(poolByBand);
  if (flat.length < 6) return null;

  const picked: number[] = [];
  const used = new Set<number>();

  for (let pos = 0; pos < 6; pos++) {
    const rungs = bandRungsForPos(pos, bandTargets, bandLadder);
    const partialSum = picked.reduce((a, b) => a + b, 0);
    const remainingAfter = 5 - pos;
    let chosen: number | null = null;

    for (const band of rungs) {
      if (chosen !== null) break;
      let candidates = collectBandCands(poolByBand, band, used, pickCtx);
      candidates = candidates.filter((n) => {
        const usage = pickCtx.usage?.get(n) ?? 0;
        return usage < MAX_NUM_USAGE;
      });
      candidates.sort((a, b) => a - b);

      for (const n of candidates) {
        if (used.has(n)) continue;
        const nextPartial = partialSum + n;
        const availAfter = filterUsageAvail(
          flat.filter((x) => !used.has(x) && x !== n),
          pickCtx.usage,
        ).sort((a, b) => a - b);

        if (remainingAfter === 0) {
          if (nextPartial >= minSum && nextPartial <= maxSum) {
            chosen = n;
            break;
          }
          continue;
        }

        if (sumRangeFeasible(nextPartial, remainingAfter, availAfter, minSum, maxSum)) {
          chosen = n;
          break;
        }
      }
    }

    if (chosen === null) return null;
    picked.push(chosen);
    used.add(chosen);
  }

  const sum = sortPickedAsc(picked).reduce((a, b) => a + b, 0);
  if (sum < minSum || sum > maxSum) return null;
  return [...picked];
};
