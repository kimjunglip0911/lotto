/** RANK18~20: 균등 0회 번호만 쓰는 3세트(18=간격, 19~20=조합). */

export const ZERO_EQUAL_GAP_RANK = 18;
export const ZERO_EQUAL_COMBO_RANKS = [19, 20] as const;
export const ZERO_EQUAL_RANKS = [18, 19, 20] as const;

/** 0회 풀에서 미추첨 간격 추출 시 쓰는 목표 칸(RANK1과 동일 1~6등). */
export const ZERO_EQUAL_GAP_PICK = 1;

export const isZeroEqualGapRank = (rank: number): boolean =>
  rank === ZERO_EQUAL_GAP_RANK;

export const isZeroEqualComboRank = (rank: number): boolean =>
  (ZERO_EQUAL_COMBO_RANKS as readonly number[]).includes(rank);

export const isZeroEqualRank = (rank: number): boolean =>
  isZeroEqualGapRank(rank) || isZeroEqualComboRank(rank);
