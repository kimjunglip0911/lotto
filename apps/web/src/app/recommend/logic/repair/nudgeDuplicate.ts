import {
  orderedSwapPositionsByDrawCount,
  tryOneSwapAtPickPosition,
} from '@/app/recommend/logic/repair/nudgeSwap';
import type { ProfileConstraints, RepairPickCtx } from '@/app/recommend/logic/repair/types';

/**
 * 이미 만든 조합과 중복일 때 1구~6구 순서를 유지한 채 번호 1개만 바꾼다.
 * 교체 구간은 구간별 총 회차(drawCount)가 가장 낮은 자리부터 시도한다.
 */
export const nudgeDuplicateCombo = (
  picked: readonly number[],
  constraints: ProfileConstraints,
  poolByBand: ReadonlyMap<number, number[]>,
  pickCtx: RepairPickCtx,
  blockedKeys: ReadonlySet<string>,
): number[] | null => {
  if (picked.length !== 6) return null;
  const positions = orderedSwapPositionsByDrawCount(picked, pickCtx);
  for (const pos of positions) {
    const next = tryOneSwapAtPickPosition(
      picked,
      pos,
      constraints,
      poolByBand,
      pickCtx,
      blockedKeys,
    );
    if (next) return next;
  }
  return null;
};
