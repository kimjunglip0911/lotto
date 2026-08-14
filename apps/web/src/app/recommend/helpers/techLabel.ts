import {
  GAP_SET_RANK_MAX,
  SECTION_SET_RANK_START,
} from '@/app/recommend/constants/gapSetRanks';
import {
  isLeftBandRank,
  isLeftGapRank,
} from '@/app/recommend/constants/leftRanks';
import {
  isZeroEqualComboRank,
  isZeroEqualGapRank,
} from '@/app/recommend/constants/zeroEqualRanks';

/** RANK별 분석 기법 표시명 */

export const TECH_GAP_EXTRACT = '간격 추출 로직';
export const TECH_ITEM_RANK = '항목별 순위 로직';
export const TECH_ZERO_GAP = '균등0회·간격';
export const TECH_ZERO_COMBO = '균등0회·항목별';

export const techLabelFromRank = (rank: number): string | null => {
  if (isZeroEqualGapRank(rank)) return TECH_ZERO_GAP;
  if (isZeroEqualComboRank(rank)) return TECH_ZERO_COMBO;
  if (isLeftGapRank(rank) || (rank >= 1 && rank <= GAP_SET_RANK_MAX)) {
    return TECH_GAP_EXTRACT;
  }
  if (isLeftBandRank(rank) || (rank >= SECTION_SET_RANK_START && rank <= 17)) {
    return TECH_ITEM_RANK;
  }
  return null;
};

export const techLabelFromStrategy = (strategy?: string | null): string | null => {
  const m = strategy?.match(/^combo:rank(\d+)$/i);
  if (!m) return null;
  return techLabelFromRank(Number(m[1]));
};
