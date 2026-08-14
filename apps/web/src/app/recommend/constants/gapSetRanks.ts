/**
 * RANK1~10(간격)과 RANK11~20(구간) 세트 분할 상수입니다.
 *
 * 하는 일
 * - RANK1~5는 미추첨 1등부터 6칸씩, RANK6~10은 번호대 개수(5세트 안 중복 없음)입니다.
 * - 구간 등수는 슬롯 rank에서 10을 뺀 값으로 변환합니다.
 */

export const GAP_SEQ_RANK_MAX = 5;
export const GAP_DECADE_MIN = 6;
export const GAP_DECADE_MAX = 10;
export const GAP_SET_RANK_MAX = 10;
export const GAP_RANKS_PER_SET = 6;
export const SECTION_SET_RANK_START = 11;
export const LOTTO_GAP_RANK_MAX = 45;

export const isGapSeqRank = (slotRank: number): boolean =>
  slotRank >= 1 && slotRank <= GAP_SEQ_RANK_MAX;

export const isGapDecadeRank = (slotRank: number): boolean =>
  slotRank >= GAP_DECADE_MIN && slotRank <= GAP_DECADE_MAX;

export const isGapSetRank = (slotRank: number): boolean =>
  slotRank >= 1 && slotRank <= GAP_SET_RANK_MAX;

export const isSectionSetRank = (slotRank: number): boolean =>
  slotRank >= SECTION_SET_RANK_START;

export const toSectionRank = (slotRank: number): number => slotRank - 10;
