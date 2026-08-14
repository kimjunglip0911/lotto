import { isLeftBandRank } from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { fillLeftBand } from '@/app/recommend/logic/combo/leftBandPick';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover면 세트, 아니면 undefined */

export const fillLeftIfMatch = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null | undefined> => {
  if (isLeftBandRank(rank)) return fillLeftBand(ctx, rank, blockedKeys);
  return undefined;
};
