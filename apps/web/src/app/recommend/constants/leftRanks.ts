/** leftover 슬롯: 21부터 30은 조합분석 미사용 등수(8등부터) */

export const CORE_SET_COUNT = 20;
export const LEFT_BAND_MIN = 21;
export const LEFT_BAND_MAX = 30;
export const LEFT_BAND_START = 8;

export const isLeftBandRank = (rank: number): boolean =>
  rank >= LEFT_BAND_MIN && rank <= LEFT_BAND_MAX;

export const leftBandTier = (slotRank: number): number =>
  LEFT_BAND_START + (slotRank - LEFT_BAND_MIN);
