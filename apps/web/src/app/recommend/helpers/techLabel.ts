import {
  GAP_SET_RANK_MAX,
  SECTION_SET_RANK_START,
} from '@/app/recommend/constants/gapSetRanks';

/** RANK1~10 / RANK11~20 분석 기법 표시명 */

export const TECH_GAP_EXTRACT = '간격 추출 로직';
export const TECH_ITEM_RANK = '항목별 순위 로직';

export const techLabelFromRank = (rank: number): string | null => {
  if (rank >= 1 && rank <= GAP_SET_RANK_MAX) return TECH_GAP_EXTRACT;
  if (rank >= SECTION_SET_RANK_START && rank <= 20) return TECH_ITEM_RANK;
  return null;
};

export const techLabelFromStrategy = (strategy?: string | null): string | null => {
  const m = strategy?.match(/^combo:rank(\d+)$/i);
  if (!m) return null;
  return techLabelFromRank(Number(m[1]));
};
