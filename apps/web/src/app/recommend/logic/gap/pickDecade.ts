import { LOTTO_GAP_RANK_MAX } from '@/app/recommend/constants/gapSetRanks';
import {
  decadeOf,
  type DecadeQuota,
} from '@/app/recommend/constants/decadeQuota';
import { buildNumberByGapRank } from '@/app/recommend/logic/gap/gapTargets';
import { canUseNum } from '@/app/recommend/logic/repair/usageLimit';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 1등부터 번호대 칸을 채우고, 모자라면 남은 최고 등수 */

export const pickDecadeGapNumbers = (
  lookup: GapRankLookup,
  quota: DecadeQuota,
  taken: ReadonlySet<number> = new Set(),
  usage: ReadonlyMap<number, number> = new Map(),
): number[] | null => {
  const remain = { ...quota };
  const picked: number[] = [];
  const used = new Set(taken);
  const byRank = buildNumberByGapRank(lookup);

  const ok = (num: number): boolean => !used.has(num) && canUseNum(num, usage);

  const tryAdd = (num: number): boolean => {
    if (!ok(num) || remain[decadeOf(num)] <= 0) return false;
    picked.push(num);
    used.add(num);
    remain[decadeOf(num)] -= 1;
    return true;
  };

  for (let rank = 1; rank <= LOTTO_GAP_RANK_MAX; rank++) {
    const num = byRank.get(rank);
    if (num !== undefined) tryAdd(num);
    if (picked.length === 6) return picked;
  }
  for (let rank = 1; rank <= LOTTO_GAP_RANK_MAX; rank++) {
    const num = byRank.get(rank);
    if (num === undefined || !ok(num)) continue;
    picked.push(num);
    used.add(num);
    if (picked.length === 6) return picked;
  }
  return null;
};
