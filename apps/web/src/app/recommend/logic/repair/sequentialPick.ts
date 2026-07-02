/**
 * 1구간(1번째 자리)부터 6구간 순으로 band 목표 번호를 고른다.
 * ladder rung 순으로 후보를 찾고, 겹침·3회 한도면 다음 등수 band로 넘긴다.
 */
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { bandRungsForPos, collectBandCands } from '@/app/recommend/logic/repair/bandFallback';
import { flatAdoptedPool } from '@/app/recommend/logic/repair/pool';

export const sequentialPickByBands = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  _minSum: number,
  _maxSum: number,
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
    let chosen: number | null = null;

    for (const band of rungs) {
      if (chosen !== null) break;
      let candidates = collectBandCands(poolByBand, band, used, pickCtx);
      candidates = candidates.filter((n) => {
        const usage = pickCtx.usage?.get(n) ?? 0;
        return usage < MAX_NUM_USAGE;
      });

      for (const n of candidates) {
        if (used.has(n)) continue;
        chosen = n;
        break;
      }
    }

    if (chosen === null) return null;
    picked.push(chosen);
    used.add(chosen);
  }

  return [...picked];
};
