import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 번호 1~15(index 0~14) 목표일 때 번호 16~30(index 15~29)에서 후보 확장 */

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
  const primary = filterUsageAvail(
    (poolByBand.get(targetBand) ?? []).filter((n) => !used.has(n)),
    pickCtx.usage,
  );
  if (primary.length > 0) return primary;

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
