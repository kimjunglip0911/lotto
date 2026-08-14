import { LOTTO_GAP_RANK_MAX } from '@/app/recommend/constants/gapSetRanks';
import { buildNumberByGapRank, targetRevGapRanks } from '@/app/recommend/logic/gap/gapTargets';
import { canUseNum } from '@/app/recommend/logic/repair/usageLimit';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 45등부터 아래로 6칸. 제외·이미 쓴 번호는 다음(더 낮은) 등수 */

export const pickRevGapNumbers = (
  setRank: number,
  lookup: GapRankLookup,
  taken: ReadonlySet<number> = new Set(),
  usage: ReadonlyMap<number, number> = new Map(),
): number[] | null => {
  if (lookup.size === 0) return null;
  const byRank = buildNumberByGapRank(lookup);
  const picked: number[] = [];
  const used = new Set(taken);

  for (const start of targetRevGapRanks(setRank)) {
    let chosen: number | null = null;
    for (let rank = start; rank >= 1; rank--) {
      const num = byRank.get(rank);
      if (num === undefined || used.has(num) || !canUseNum(num, usage)) continue;
      chosen = num;
      break;
    }
    if (chosen === null) {
      for (let rank = LOTTO_GAP_RANK_MAX; rank >= 1; rank--) {
        const num = byRank.get(rank);
        if (num === undefined || used.has(num) || !canUseNum(num, usage)) continue;
        chosen = num;
        break;
      }
    }
    if (chosen === null) return null;
    picked.push(chosen);
    used.add(chosen);
  }
  return picked;
};
