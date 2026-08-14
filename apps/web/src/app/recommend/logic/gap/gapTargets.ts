/**
 * 간격 순위 기반 세트(RANK1~10)에서 칸별 목표 간격순위를 계산합니다.
 *
 * 하는 일
 * - RANK1~5는 1등부터 6칸, RANK6~10은 45등부터 역순 6칸입니다.
 * - lookup에서 rank→number 역매핑과 45 초과 칸 fallback 후보를 제공합니다.
 */

import {
  GAP_RANKS_PER_SET,
  GAP_REV_MIN,
  LOTTO_GAP_RANK_MAX,
} from '@/app/recommend/constants/gapSetRanks';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

export const targetGapRanksFromStart = (start: number): number[] =>
  Array.from({ length: GAP_RANKS_PER_SET }, (_, index) => start + index);

export const targetGapRanksForSetRank = (setRank: number): number[] =>
  targetGapRanksFromStart((setRank - 1) * GAP_RANKS_PER_SET + 1);

/** RANK6=45~40, RANK10=21~16. 제외면 더 낮은 등수 */
export const targetRevGapRanks = (setRank: number): number[] => {
  const start = LOTTO_GAP_RANK_MAX - (setRank - GAP_REV_MIN) * GAP_RANKS_PER_SET;
  return Array.from({ length: GAP_RANKS_PER_SET }, (_, i) => start - i);
};

export const buildNumberByGapRank = (lookup: GapRankLookup): ReadonlyMap<number, number> => {
  const map = new Map<number, number>();
  for (const row of lookup.values()) {
    map.set(row.rank, row.number);
  }
  return map;
};

export const gapRowsByRankDesc = (lookup: GapRankLookup): GapRankRow[] =>
  [...lookup.values()].sort((a, b) => b.rank - a.rank);

export const isBeyondGapRankPool = (targetRank: number): boolean =>
  targetRank > LOTTO_GAP_RANK_MAX;
