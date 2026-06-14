import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 목표 band에서 후보를 모은다. 한도·used 소진 시 빈 배열 → ladder 다음 등수로 넘긴다. */

export const matchesBandTarget = (targetBand: number, actualBand: number): boolean =>
  targetBand === actualBand;

export const bandRungsForPos = (
  pos: number,
  bandTargets: readonly number[],
  bandLadder?: readonly (readonly number[])[],
): readonly number[] => {
  const rungs = bandLadder?.[pos];
  if (rungs && rungs.length > 0) return rungs;
  return [bandTargets[pos]!];
};

export const matchesBandAtPos = (
  pos: number,
  actualBand: number,
  bandTargets: readonly number[],
  bandLadder?: readonly (readonly number[])[],
): boolean =>
  bandRungsForPos(pos, bandTargets, bandLadder).some((b) => matchesBandTarget(b, actualBand));

export const collectBandCands = (
  poolByBand: ReadonlyMap<number, number[]>,
  targetBand: number,
  used: ReadonlySet<number>,
  pickCtx: RepairPickCtx,
): number[] => {
  const bandPool = poolByBand.get(targetBand) ?? [];
  const poolInBand = bandPool.filter((n) => !used.has(n));
  const primary = filterUsageAvail(poolInBand, pickCtx.usage);
  if (primary.length > 0) return primary;

  /** 풀에 번호는 있으나 한도·이번 세트 used → ladder 다음 등수로 */
  if (bandPool.length > 0) return [];

  return [];
};
