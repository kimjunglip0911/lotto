import { numberToBandIndex } from '@/app/combination/logic/numberToBand';
import type { SetViolation } from '@/app/recommend/logic/repair/types';
import { rankAtPosition, drawCountAtPosition } from '@/app/recommend/helpers/positionRankLookup';
import { collectBandCands, matchesBandTarget } from '@/app/recommend/logic/repair/bandFallback';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import { diverseCandidateOrder } from '@/app/recommend/logic/repair/diverse';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';

/** 위반 유형에 맞는 교체 자리·후보를 고른다 */

type AppearCtx = Pick<
  RepairPickCtx,
  'histCounts' | 'usage' | 'positionRankLookup' | 'positionDrawCountLookup'
>;

/** 번호의 통계 출현 횟수(없으면 생성 usage, 둘 다 없으면 0) */
export const numAppearCount = (n: number, ctx?: AppearCtx): number => {
  if (ctx?.histCounts && n >= 1 && n <= 45) return ctx.histCounts[n - 1] ?? 0;
  return ctx?.usage?.get(n) ?? 0;
};

/**
 * 1구~6구 뽑기 순서(num1~num6) 중 교체할 인덱스.
 * positionDrawCountLookup이 있으면 구간별 총 회차(drawCount)가 가장 낮은 자리를 고른다.
 */
export const pickMinAppearPosition = (
  nums: readonly number[],
  ctx?: AppearCtx,
): number => {
  if (ctx?.positionDrawCountLookup && nums.length === 6) {
    let bestIdx = 0;
    let bestDraw = drawCountAtPosition(ctx.positionDrawCountLookup, 1, nums[0]!);
    for (let i = 1; i < nums.length; i++) {
      const dc = drawCountAtPosition(ctx.positionDrawCountLookup, i + 1, nums[i]!);
      if (dc < bestDraw) {
        bestIdx = i;
        bestDraw = dc;
        continue;
      }
      if (dc !== bestDraw) continue;
      const rankLookup = ctx.positionRankLookup;
      if (rankLookup) {
        const bestRank = rankAtPosition(rankLookup, bestIdx + 1, nums[bestIdx]!) ?? 0;
        const rank = rankAtPosition(rankLookup, i + 1, nums[i]!) ?? 0;
        if (rank > bestRank || (rank === bestRank && nums[i]! > nums[bestIdx]!)) {
          bestIdx = i;
          bestDraw = dc;
        }
      } else if (nums[i]! > nums[bestIdx]!) {
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  if (ctx?.positionRankLookup && nums.length === 6) {
    let bestIdx = 0;
    let bestRank = rankAtPosition(ctx.positionRankLookup, 1, nums[0]!) ?? 0;
    for (let i = 1; i < nums.length; i++) {
      const rank = rankAtPosition(ctx.positionRankLookup, i + 1, nums[i]!) ?? 0;
      if (rank > bestRank || (rank === bestRank && nums[i]! > nums[bestIdx]!)) {
        bestIdx = i;
        bestRank = rank;
      }
    }
    return bestIdx;
  }

  let bestIdx = 0;
  let bestAppear = numAppearCount(nums[0]!, ctx);
  let bestNum = nums[0]!;
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i]!;
    const appear = numAppearCount(n, ctx);
    if (appear < bestAppear || (appear === bestAppear && n < bestNum)) {
      bestIdx = i;
      bestAppear = appear;
      bestNum = n;
    }
  }
  return bestIdx;
};

/** @deprecated pickMinAppearPosition 사용 */
export const pickMinUsagePosition = pickMinAppearPosition;

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
  pickCtx?: AppearCtx,
): number => {
  if (violations.includes('band')) {
    for (let i = 0; i < 6; i++) {
      if (!matchesBandTarget(bandTargets[i]!, numberToBandIndex(picked[i]!))) return i;
    }
  }
  const metricViolations = violations.filter((v) => v !== 'band' && v !== 'duplicate');
  if (metricViolations.length === 0) {
    return pickMinAppearPosition(picked, pickCtx);
  }
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
    position + 1,
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
