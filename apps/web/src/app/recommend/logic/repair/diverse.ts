import { innerSlotKey } from '@/app/recommend/logic/repair/innerSlot';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';
import { rankAtPosition } from '@/app/recommend/helpers/positionRankLookup';

/** 덜 쓴 번호·칸을 우선하는 후보 순서 */

const DIVERSE_TOP_K = 8;
const INF = Number.POSITIVE_INFINITY;

const posRank = (n: number, ctx: RepairPickCtx, position?: number): number =>
  position && ctx.positionRankLookup
    ? rankAtPosition(ctx.positionRankLookup, position, n) ?? INF
    : INF;

const candidateScore = (n: number, ctx: RepairPickCtx): number => {
  const used = ctx.usage?.get(n) ?? 0;
  const slotUsed = ctx.innerSlotUsage?.get(innerSlotKey(n)) ?? 0;
  return used * 12 + slotUsed * 4;
};

export const orderCandidatesByPriority = (
  list: readonly number[],
  ctx: RepairPickCtx,
  position?: number,
): number[] =>
  [...list].sort((a, b) => {
    const posDiff = posRank(a, ctx, position) - posRank(b, ctx, position);
    if (posDiff !== 0) return posDiff;
    const scoreDiff = candidateScore(a, ctx) - candidateScore(b, ctx);
    return scoreDiff !== 0 ? scoreDiff : a - b;
  });

export const diverseCandidateOrder = (
  list: readonly number[],
  ctx: RepairPickCtx,
  position?: number,
): number[] =>
  orderCandidatesByPriority(list, ctx, position).slice(0, DIVERSE_TOP_K);

export const pickDiverseOne = (
  candidates: readonly number[],
  ctx: RepairPickCtx,
  position?: number,
): number | null => {
  if (candidates.length === 0) return null;
  return orderCandidatesByPriority(candidates, ctx, position)[0] ?? null;
};
