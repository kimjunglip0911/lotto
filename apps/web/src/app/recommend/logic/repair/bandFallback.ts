import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** band 1~3(index 0~2) 비었을 때 band 4~6(index 3~5)에서 후보 확장 */

export const LOW_BAND_INDICES = [0, 1, 2] as const;
export const MID_BAND_INDICES = [3, 4, 5] as const;

export const isLowBandIndex = (band: number): boolean =>
  (LOW_BAND_INDICES as readonly number[]).includes(band);

export const isMidBandIndex = (band: number): boolean =>
  (MID_BAND_INDICES as readonly number[]).includes(band);

export const isBandFallbackOk = (targetBand: number, actualBand: number): boolean =>
  isLowBandIndex(targetBand) && isMidBandIndex(actualBand);

export const matchesBandTarget = (targetBand: number, actualBand: number): boolean =>
  targetBand === actualBand || isBandFallbackOk(targetBand, actualBand);

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
  for (const b of MID_BAND_INDICES) {
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
