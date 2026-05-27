import { innerSlotKey } from '@/app/recommend/logic/repair/innerSlot';
import type { RepairPickCtx } from '@/app/recommend/logic/repair/types';

/** 덜 쓴 번호·칸을 우선하는 후보 순서 */

const DIVERSE_TOP_K = 8;

const candidateScore = (n: number, ctx: RepairPickCtx): number => {
  const used = ctx.usage?.get(n) ?? 0;
  const slotUsed = ctx.innerSlotUsage?.get(innerSlotKey(n)) ?? 0;
  return used * 12 + slotUsed * 4;
};

const shuffleNums = (nums: readonly number[]): number[] => {
  const out = [...nums];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
};

const orderCandidatesDiverse = (list: readonly number[], ctx: RepairPickCtx): number[] => {
  const byScore = new Map<number, number[]>();
  for (const n of list) {
    const score = candidateScore(n, ctx);
    const bucket = byScore.get(score) ?? [];
    bucket.push(n);
    byScore.set(score, bucket);
  }
  const out: number[] = [];
  for (const score of [...byScore.keys()].sort((a, b) => a - b)) {
    out.push(...shuffleNums(byScore.get(score)!));
  }
  return out;
};

export const diverseCandidateOrder = (list: readonly number[], ctx: RepairPickCtx): number[] => {
  const ordered = orderCandidatesDiverse(list, ctx);
  const topK = ordered.slice(0, Math.min(DIVERSE_TOP_K, ordered.length));
  return shuffleNums(topK);
};

export const pickDiverseOne = (candidates: readonly number[], ctx: RepairPickCtx): number | null => {
  if (candidates.length === 0) return null;
  const top = orderCandidatesDiverse(candidates, ctx).slice(
    0,
    Math.min(DIVERSE_TOP_K, candidates.length),
  );
  const weights = top.map((n) => 1 / (candidateScore(n, ctx) + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return top[i]!;
  }
  return top[top.length - 1]!;
};
