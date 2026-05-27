/** 조합 기반 20세트 생성 — 공개 API */

export {
  TARGET_SET_COUNT,
  MIN_BAND_TIER_PERCENT,
} from '@/app/recommend/constants/comboThresholds';

export {
  COMBO_PROFILE_SLOT_CYCLE,
  COMBO_PROFILE_SLOT_ORDER,
  COMBO_RANK_TRIPLE_PRIORITY_ORDER,
} from '@/app/recommend/constants/comboSlots';

export {
  bandStartForIndex,
  bandInnerSlot,
  innerSlotKey,
  areBandTargetsMonotonic,
  effectiveBandRankIdx,
  makeMonotonicBandTargets,
  buildBandTargetsPerPosition,
} from '@/app/recommend/logic/combo/bandUtil';

export {
  parseComboStrategyRanks,
  sortGeneratedSetsByComboStrategy,
  orderSetsByProfileSlots,
  formatProfileTriple,
  setsInProfileSlotOrder,
} from '@/app/recommend/logic/combo/orderSets';

export type { CombinationGenerationResult } from '@/app/recommend/logic/combo/generate';
export { generateCombinationBasedSets } from '@/app/recommend/logic/combo/generate';
