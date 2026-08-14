import { GAP_RANKS_PER_SET } from '@/app/recommend/constants/gapSetRanks';

/** leftover 슬롯: 21부터 25 간격, 26부터 30 항목별 */

export const CORE_SET_COUNT = 20;
export const LEFT_GAP_MIN = 21;
export const LEFT_GAP_MAX = 25;
export const LEFT_BAND_MIN = 26;
export const LEFT_BAND_MAX = 30;
export const LEFT_GAP_START = 11;
export const LEFT_BAND_START = 11;

export const isLeftGapRank = (rank: number): boolean =>
  rank >= LEFT_GAP_MIN && rank <= LEFT_GAP_MAX;

export const isLeftBandRank = (rank: number): boolean =>
  rank >= LEFT_BAND_MIN && rank <= LEFT_BAND_MAX;

export const leftGapStartRank = (slotRank: number): number =>
  LEFT_GAP_START + (slotRank - LEFT_GAP_MIN) * GAP_RANKS_PER_SET;

export const leftBandTier = (slotRank: number): number =>
  LEFT_BAND_START + (slotRank - LEFT_BAND_MIN);
