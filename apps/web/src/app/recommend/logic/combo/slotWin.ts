import type { ComboWinKey } from '@/app/combination/types/window';
import {
  STATS_WINDOW_ALL,
  STATS_WINDOW_ONE_YEAR,
  STATS_WINDOW_THREE_YEAR,
} from '@/lib/statsWindow';

/** 기간별 최근 회차 수. all은 상한 없음. */
export const WIN_SIZES: Record<ComboWinKey, number> = {
  '1y': STATS_WINDOW_ONE_YEAR,
  '3y': STATS_WINDOW_THREE_YEAR,
  all: STATS_WINDOW_ALL,
};

/** 세트 번호 1~10은 1년, 11~20은 3년, 21~30은 전체. */
export const slotWinKey = (slotRank: number): ComboWinKey => {
  if (slotRank <= 10) return '1y';
  if (slotRank <= 20) return '3y';
  return 'all';
};

/** 각 기간 안에서 시작 등수는 1~10을 반복한다. */
export const slotBandRank = (slotRank: number): number => ((slotRank - 1) % 10) + 1;
