import { isLeftBandRank, isLeftGapRank } from '@/app/recommend/constants/leftRanks';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
import { fillLeftBand } from '@/app/recommend/logic/combo/leftBandPick';
import { fillLeftGap } from '@/app/recommend/logic/combo/leftGapPick';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** leftover면 세트, 아니면 undefined */

export const fillLeftIfMatch = async (
  ctx: FillCtx,
  rank: number,
  blockedKeys: ReadonlySet<string>,
): Promise<GeneratedSet | null | undefined> => {
  if (isLeftGapRank(rank)) return fillLeftGap(ctx, rank, blockedKeys);
  if (isLeftBandRank(rank)) return fillLeftBand(ctx, rank, blockedKeys);
  return undefined;
};
