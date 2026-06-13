import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** 9슬롯 1회분(oe·band) */

export const COMBO_PROFILE_SLOT_CYCLE: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 1],
  [3, 2],
  [3, 3],
] as const;

export const COMBO_PROFILE_SLOT_ORDER: ReadonlyArray<readonly [number, number]> = [
  ...COMBO_PROFILE_SLOT_CYCLE,
  ...COMBO_PROFILE_SLOT_CYCLE,
  ...COMBO_PROFILE_SLOT_CYCLE.slice(0, TARGET_SET_COUNT - COMBO_PROFILE_SLOT_CYCLE.length * 2),
];

export const COMBO_RANK_PAIR_PRIORITY_ORDER: ReadonlyArray<readonly [number, number]> = [
  ...COMBO_PROFILE_SLOT_ORDER,
];

/** @deprecated COMBO_RANK_PAIR_PRIORITY_ORDER 사용 */
export const COMBO_RANK_TRIPLE_PRIORITY_ORDER = COMBO_RANK_PAIR_PRIORITY_ORDER;

if (COMBO_PROFILE_SLOT_ORDER.length !== TARGET_SET_COUNT) {
  throw new Error('COMBO_PROFILE_SLOT_ORDER must match TARGET_SET_COUNT');
}
