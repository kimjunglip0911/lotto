import { isGapSetRank } from '@/app/recommend/constants/gapSetRanks';
import { isLeftBandRank } from '@/app/recommend/constants/leftRanks';
import {
  isZeroEqualComboRank,
  isZeroEqualGapRank,
} from '@/app/recommend/constants/zeroEqualRanks';

/** RANK별 분석 기법 표시명 */

export const TECH_GAP_EXTRACT = '미추첨 간격 추출';
export const TECH_ITEM_RANK = '항목별 순위 로직';
export const TECH_ZERO_GAP = '균등0회·미추첨 간격';
export const TECH_ZERO_COMBO = '균등0회·항목별';

export const techLabelFromRank = (rank: number): string | null => {
  if (isZeroEqualGapRank(rank)) return TECH_ZERO_GAP;
  if (isZeroEqualComboRank(rank)) return TECH_ZERO_COMBO;
  if (isGapSetRank(rank)) return TECH_GAP_EXTRACT;
  if (isLeftBandRank(rank) || (rank >= 11 && rank <= 17)) return TECH_ITEM_RANK;
  return null;
};

export const techLabelFromStrategy = (strategy?: string | null): string | null => {
  const m = strategy?.match(/^combo:rank(\d+)$/i);
  if (!m) return null;
  return techLabelFromRank(Number(m[1]));
};
