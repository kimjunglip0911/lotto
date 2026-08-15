import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** rank 1부터 TARGET_SET_COUNT 슬롯 */

export const COMBO_RANK_SLOT_ORDER: readonly number[] = Array.from(
  { length: TARGET_SET_COUNT },
  (_, i) => i + 1,
);

if (COMBO_RANK_SLOT_ORDER.length !== TARGET_SET_COUNT) {
  throw new Error('COMBO_RANK_SLOT_ORDER must match TARGET_SET_COUNT');
}
