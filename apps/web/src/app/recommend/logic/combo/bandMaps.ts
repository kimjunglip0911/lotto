import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  buildBandLadderForRankCascade,
  buildBandTargetsForRankCascade,
} from '@/app/recommend/logic/combo/buildBandTargets';

/** rank N마다 N등 자리대 ladder를 만든다 */

export const buildRankLadders = (
  flatByWindow: readonly (readonly PositionBandDistributionRow[])[],
) => {
  const targetsByRank = new Map<number, number[]>();
  const laddersByRank = new Map<number, number[][]>();
  for (const rank of COMBO_RANK_SLOT_ORDER) {
    const targets = buildBandTargetsForRankCascade(flatByWindow, rank);
    const ladder = buildBandLadderForRankCascade(flatByWindow, rank);
    if (!targets || !ladder) continue;
    targetsByRank.set(rank, targets);
    laddersByRank.set(rank, ladder);
  }
  return { targetsByRank, laddersByRank };
};
