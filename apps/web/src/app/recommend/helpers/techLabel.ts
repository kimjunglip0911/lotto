import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

export const TECH_ITEM_RANK = '항목별 순위 로직';

export const techLabelFromRank = (rank: number): string | null =>
  rank >= 1 && rank <= TARGET_SET_COUNT ? TECH_ITEM_RANK : null;

export const techLabelFromStrategy = (strategy?: string | null): string | null => {
  const m = strategy?.match(/^combo:rank(\d+)$/i);
  if (!m) return null;
  return techLabelFromRank(Number(m[1]));
};
