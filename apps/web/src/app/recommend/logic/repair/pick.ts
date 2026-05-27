import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { flatAdoptedPool } from '@/app/recommend/logic/repair/pool';
import { pickDiverseOne } from '@/app/recommend/logic/repair/diverse';

/** 자리별 band에서 번호를 뽑는다 */

const pickSixFromFlatPool = (flat: readonly number[], pickCtx: RepairPickCtx): number[] | null => {
  if (flat.length < 6) return null;
  const used = new Set<number>();
  const picked: number[] = [];
  for (let i = 0; i < 6; i++) {
    const candidates = flat.filter((n) => !used.has(n));
    if (candidates.length === 0) return null;
    const pick = pickDiverseOne(candidates, pickCtx) ?? candidates[0]!;
    picked.push(pick);
    used.add(pick);
  }
  return picked;
};

export const randomPerPositionPick = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx = {},
): number[] | null => {
  if (bandTargets.length !== 6) return null;
  const flat = flatAdoptedPool(poolByBand);
  if (flat.length < 6) return null;
  const picked: number[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 6; i++) {
    const band = bandTargets[i]!;
    let candidates = (poolByBand.get(band) ?? []).filter((n) => !used.has(n));
    if (candidates.length === 0) candidates = flat.filter((n) => !used.has(n));
    if (candidates.length === 0) return null;
    const pick = pickDiverseOne(candidates, pickCtx) ?? candidates[0]!;
    picked.push(pick);
    used.add(pick);
  }
  return picked;
};

export const randomBandSeed = (
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
): number[] | null => randomPerPositionPick(poolByBand, bandTargets);

export { pickSixFromFlatPool };
