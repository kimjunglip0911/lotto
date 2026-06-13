/** 조합 기반 20세트 생성 — 공개 API */

export { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

export {
  COMBO_RANK_SLOT_ORDER,
  COMBO_PROFILE_SLOT_CYCLE,
  COMBO_PROFILE_SLOT_ORDER,
  COMBO_RANK_PAIR_PRIORITY_ORDER,
  COMBO_RANK_TRIPLE_PRIORITY_ORDER,
} from '@/app/recommend/constants/comboSlots';

export {
  bandStartForIndex,
  bandInnerSlot,
  innerSlotKey,
} from '@/app/recommend/logic/combo/bandSlot';

export {
  areBandTargetsMonotonic,
  makeMonotonicBandTargets,
} from '@/app/recommend/logic/combo/bandMonotonic';

export { effectiveBandRankIdx } from '@/app/recommend/logic/combo/bandRankPick';

export {
  buildBandTargetsForRank,
  buildBandTargetsPerPosition,
} from '@/app/recommend/logic/combo/buildBandTargets';

export {
  parseComboStrategyRank,
  parseComboStrategyRanks,
  sortGeneratedSetsByComboStrategy,
  orderSetsByProfileSlots,
  formatProfileRank,
  formatProfilePair,
  formatProfileTriple,
  setsInProfileSlotOrder,
} from '@/app/recommend/logic/combo/orderSets';

export type { CombinationGenerationResult } from '@/app/recommend/logic/combo/generate';
export { generateCombinationBasedSets } from '@/app/recommend/logic/combo/generate';
