/**
 * RANK1~10(간격)과 RANK11~20(구간) 세트 분할 상수입니다.
 *
 * 하는 일
 * - 간격 세트는 RANK1~10, 구간 세트는 RANK11~20 슬롯에 대응합니다.
 * - 구간 등수는 슬롯 rank에서 10을 뺀 값으로 변환합니다.
 */

export const GAP_SET_RANK_MAX = 10;
export const GAP_RANKS_PER_SET = 6;
export const SECTION_SET_RANK_START = 11;
export const LOTTO_GAP_RANK_MAX = 45;

export const isGapSetRank = (slotRank: number): boolean =>
  slotRank >= 1 && slotRank <= GAP_SET_RANK_MAX;

export const isSectionSetRank = (slotRank: number): boolean =>
  slotRank >= SECTION_SET_RANK_START;

export const toSectionRank = (slotRank: number): number => slotRank - 10;
