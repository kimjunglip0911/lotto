import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 번호 1~15(index 0~14) 목표인데 풀에 해당 band가 없을 때만 16~30(index 15~29) 후보 확장. 한도 소진은 ladder 다음 등수. */

export const LOW_BAND_MAX_INDEX = 14;
export const MID_BAND_MIN_INDEX = 15;
export const MID_BAND_MAX_INDEX = 29;

export const isLowBandIndex = (band: number): boolean => band <= LOW_BAND_MAX_INDEX;

export const isMidBandIndex = (band: number): boolean =>
  band >= MID_BAND_MIN_INDEX && band <= MID_BAND_MAX_INDEX;

export const isBandFallbackOk = (targetBand: number, actualBand: number): boolean =>
  isLowBandIndex(targetBand) && isMidBandIndex(actualBand);

export const matchesBandTarget = (targetBand: number, actualBand: number): boolean =>
  targetBand === actualBand || isBandFallbackOk(targetBand, actualBand);

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

const midBandIndices = (): number[] =>
  Array.from(
    { length: MID_BAND_MAX_INDEX - MID_BAND_MIN_INDEX + 1 },
    (_, i) => MID_BAND_MIN_INDEX + i,
  );

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

  if (!isLowBandIndex(targetBand)) return [];

  const seen = new Set<number>();
  const merged: number[] = [];
  for (const b of midBandIndices()) {
    for (const n of filterUsageAvail(
      (poolByBand.get(b) ?? []).filter((n) => !used.has(n) && !seen.has(n)),
      pickCtx.usage,
    )) {
      seen.add(n);
      merged.push(n);
    }
  }
  return merged;
};
