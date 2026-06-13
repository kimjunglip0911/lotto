import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';
import type { SetViolation } from '@/app/recommend/logic/repair/types';
import { collectBandCands, matchesBandTarget } from '@/app/recommend/logic/repair/bandFallback';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { diverseCandidateOrder } from '@/app/recommend/logic/repair/diverse';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 위반 유형에 맞는 교체 자리·후보를 고른다 */

const indexOfMax = (sorted: readonly number[]): number => {
  let idx = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! > sorted[idx]!) idx = i;
  }
  return idx;
};

const indexOfMin = (sorted: readonly number[]): number => {
  let idx = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! < sorted[idx]!) idx = i;
  }
  return idx;
};

const pickRepairSortedIndex = (
  sorted: readonly number[],
  violations: readonly SetViolation[],
): number => {
  if (violations.includes('sum_high')) return indexOfMax(sorted);
  if (violations.includes('sum_low')) return indexOfMin(sorted);
  return 0;
};

export const pickRepairPosition = (
  picked: readonly number[],
  violations: readonly SetViolation[],
  bandTargets: readonly number[],
): number => {
  if (violations.includes('band')) {
    for (let i = 0; i < 6; i++) {
      if (!matchesBandTarget(bandTargets[i]!, numberToBandIndex(picked[i]!))) return i;
    }
  }
  const metricViolations = violations.filter((v) => v !== 'band' && v !== 'duplicate');
  if (metricViolations.length === 0) return 0;
  const sorted = sortPickedAsc(picked);
  const si = pickRepairSortedIndex(sorted, metricViolations);
  const value = sorted[si]!;
  const pi = picked.indexOf(value);
  return pi >= 0 ? pi : 0;
};

export const replaceCandidatesForPosition = (
  picked: readonly number[],
  position: number,
  poolByBand: ReadonlyMap<number, number[]>,
  bandTargets: readonly number[],
  pickCtx: RepairPickCtx,
): number[] => {
  const band = bandTargets[position]!;
  const current = picked[position];
  const used = new Set(picked);
  return diverseCandidateOrder(
    collectBandCands(poolByBand, band, used, pickCtx).filter(
      (n) => n !== current && !used.has(n),
    ),
    pickCtx,
  );
};

export const replaceCandidatesFromFullPool = (
  picked: readonly number[],
  position: number,
  flatPool: readonly number[],
  pickCtx: RepairPickCtx,
): number[] => {
  const current = picked[position];
  const used = new Set(picked);
  return diverseCandidateOrder(
    filterUsageAvail(
      flatPool.filter((n) => n !== current && !used.has(n)),
      pickCtx.usage,
    ),
    pickCtx,
  );
};
