import { setKey } from '@/app/recommend/logic/combo/toSet';
import {
  drawCountAtPosition,
  rankAtPosition,
} from '@/app/recommend/helpers/positionRankLookup';
import { numAppearCount } from '@/app/recommend/logic/repair/repairPos';
import { bandRungsForPos, collectBandCands } from '@/app/recommend/logic/repair/bandFallback';
import { diverseCandidateOrder } from '@/app/recommend/logic/repair/diverse';
import { sortPickedAsc } from '@/app/recommend/logic/repair/runLen';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';
import {
  filterUsageAvail,
  isSetWithinUsageLimit,
} from '@/app/recommend/logic/repair/usageLimit';

/** 1구~6구: 구간별 drawCount(총 회차) 오름차순 → rank 내림차순 → 번호 내림차순 */
export const orderedSwapPositionsByDrawCount = (
  picked: readonly number[],
  pickCtx: RepairPickCtx,
): number[] => {
  const indices = [0, 1, 2, 3, 4, 5];
  const drawLookup = pickCtx.positionDrawCountLookup;

  if (drawLookup && picked.length === 6) {
    return indices.sort((a, b) => {
      const dcA = drawCountAtPosition(drawLookup, a + 1, picked[a]!);
      const dcB = drawCountAtPosition(drawLookup, b + 1, picked[b]!);
      if (dcA !== dcB) return dcA - dcB;
      const rankLookup = pickCtx.positionRankLookup;
      if (rankLookup) {
        const rankA = rankAtPosition(rankLookup, a + 1, picked[a]!) ?? 0;
        const rankB = rankAtPosition(rankLookup, b + 1, picked[b]!) ?? 0;
        if (rankB !== rankA) return rankB - rankA;
      }
      return picked[b]! - picked[a]!;
    });
  }

  return indices.sort((a, b) => {
    const appearA = numAppearCount(picked[a]!, pickCtx);
    const appearB = numAppearCount(picked[b]!, pickCtx);
    if (appearA !== appearB) return appearA - appearB;
    return a - b;
  });
};

/** @deprecated orderedSwapPositionsByDrawCount 사용 */
export const orderedSwapPositionsByRank = orderedSwapPositionsByDrawCount;

/** picked[pos] 번호 1개만 교체(1구~6구 순서 유지, 재정렬 없음) */
export const tryOneSwapAtPickPosition = (
  picked: readonly number[],
  pos: number,
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  blockedKeys: ReadonlySet<string>,
): number[] | null => {
  const usage = pickCtx.usage ?? new Map<number, number>();
  const current = picked[pos]!;
  const used = new Set(picked);
  const rungs = bandRungsForPos(pos, constraints.bandTargets, constraints.bandLadder);
  const seen = new Set<number>();
  const candidates: number[] = [];

  for (const band of rungs) {
    for (const n of diverseCandidateOrder(
      filterUsageAvail(
        collectBandCands(poolByBand, band, used, pickCtx).filter(
          (c) => c !== current && !used.has(c),
        ),
        usage,
      ),
      pickCtx,
    )) {
      if (seen.has(n)) continue;
      seen.add(n);
      candidates.push(n);
    }
  }

  for (const n of candidates) {
    const next = [...picked];
    next[pos] = n;
    const sum = sortPickedAsc(next).reduce((a, b) => a + b, 0);
    if (sum < constraints.minSum || sum > constraints.maxSum) continue;
    if (blockedKeys.has(setKey(next))) continue;
    if (!isSetWithinUsageLimit(next, usage)) continue;
    return next;
  }
  return null;
};

/** 집합 기준 번호 1개만 추가·1개만 제거되었는지 */
export const isOneNumberSetDiff = (
  base: readonly number[],
  next: readonly number[],
): boolean => {
  if (base.length !== next.length) return false;
  const map = new Map<number, number>();
  for (const n of base) map.set(n, (map.get(n) ?? 0) + 1);
  for (const n of next) map.set(n, (map.get(n) ?? 0) - 1);
  let removed = 0;
  let added = 0;
  for (const delta of map.values()) {
    if (delta === -1) removed++;
    else if (delta === 1) added++;
    else if (delta !== 0) return false;
  }
  return removed === 1 && added === 1;
};

/** @deprecated isOneNumberSetDiff 사용 */
export const isOneNumberDiff = isOneNumberSetDiff;
