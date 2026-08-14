/**
 * RANK1~10(간격)과 RANK11~20(구간) 세트 분할 상수입니다.
 *
 * 하는 일
 * - RANK1~5는 1등부터 6칸, RANK6~10은 45등부터 역순 6칸입니다.
 * - 각 그룹(1~5, 6~10) 안에서는 같은 번호를 한 번만 씁니다.
 */

export const GAP_SEQ_RANK_MAX = 5;
export const GAP_REV_MIN = 6;
export const GAP_REV_MAX = 10;
export const GAP_SET_RANK_MAX = 10;
export const GAP_RANKS_PER_SET = 6;
export const SECTION_SET_RANK_START = 11;
export const LOTTO_GAP_RANK_MAX = 45;

export const isGapSeqRank = (slotRank: number): boolean =>
  slotRank >= 1 && slotRank <= GAP_SEQ_RANK_MAX;

export const isGapRevRank = (slotRank: number): boolean =>
  slotRank >= GAP_REV_MIN && slotRank <= GAP_REV_MAX;

export const isGapSetRank = (slotRank: number): boolean =>
  slotRank >= 1 && slotRank <= GAP_SET_RANK_MAX;

export const isSectionSetRank = (slotRank: number): boolean =>
  slotRank >= SECTION_SET_RANK_START;

export const toSectionRank = (slotRank: number): number => slotRank - 10;
