import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** rank 1~20 슬롯 — 자리별 band tier는 rank 3개마다 1씩 증가(1~3→1등, 4~6→2등 …) */

export const COMBO_RANK_SLOT_ORDER: readonly number[] = Array.from(
  { length: TARGET_SET_COUNT },
  (_, i) => i + 1,
);

/** @deprecated COMBO_RANK_SLOT_ORDER 사용 */
export const COMBO_PROFILE_SLOT_CYCLE = COMBO_RANK_SLOT_ORDER;

/** @deprecated COMBO_RANK_SLOT_ORDER 사용 */
export const COMBO_PROFILE_SLOT_ORDER = COMBO_RANK_SLOT_ORDER.map((rank) => [1, rank] as const);

export const COMBO_RANK_PAIR_PRIORITY_ORDER = COMBO_RANK_SLOT_ORDER;

/** @deprecated COMBO_RANK_SLOT_ORDER 사용 */
export const COMBO_RANK_TRIPLE_PRIORITY_ORDER = COMBO_RANK_SLOT_ORDER;

if (COMBO_RANK_SLOT_ORDER.length !== TARGET_SET_COUNT) {
  throw new Error('COMBO_RANK_SLOT_ORDER must match TARGET_SET_COUNT');
}
