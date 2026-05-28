import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** 15슬롯 1회분(oe·run·band) */

export const COMBO_PROFILE_SLOT_CYCLE: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 1],
  [1, 1, 2],
  [1, 1, 3],
  [1, 2, 1],
  [1, 2, 2],
  [1, 2, 3],
  [2, 1, 1],
  [2, 1, 2],
  [2, 1, 3],
  [2, 2, 1],
  [2, 2, 2],
  [2, 2, 3],
  [3, 1, 1],
  [3, 1, 2],
  [3, 1, 3],
] as const;

export const COMBO_PROFILE_SLOT_ORDER: ReadonlyArray<readonly [number, number, number]> = [
  ...COMBO_PROFILE_SLOT_CYCLE,
  ...COMBO_PROFILE_SLOT_CYCLE.slice(0, 5),
];

export const COMBO_RANK_TRIPLE_PRIORITY_ORDER: ReadonlyArray<
  readonly [number, number, number]
> = [...COMBO_PROFILE_SLOT_ORDER];

if (COMBO_PROFILE_SLOT_ORDER.length !== TARGET_SET_COUNT) {
  throw new Error('COMBO_PROFILE_SLOT_ORDER must match TARGET_SET_COUNT');
}
