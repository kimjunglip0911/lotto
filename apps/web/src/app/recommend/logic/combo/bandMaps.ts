import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { buildBandLadderForRankCascade } from '@/app/recommend/logic/combo/buildLadder';
import { slotBandRank, slotWinKey } from '@/app/recommend/logic/combo/slotWin';
import type { WinFlats } from '@/app/recommend/logic/combo/winFlats';

/** 세트 1~10은 1년, 11~20은 3년, 21~30은 전체. 각 기간 등수는 1~10. */

export const buildRankLadders = (flats: WinFlats) => {
  const targetsByRank = new Map<number, number[]>();
  const laddersByRank = new Map<number, number[][]>();
  for (const slot of COMBO_RANK_SLOT_ORDER) {
    const flat = flats[slotWinKey(slot)];
    const bandRank = slotBandRank(slot);
    const ladder = buildBandLadderForRankCascade([flat], bandRank);
    if (!ladder) continue;
    targetsByRank.set(slot, ladder.map((rungs) => rungs[0]!));
    laddersByRank.set(slot, ladder);
  }
  return { targetsByRank, laddersByRank };
};
