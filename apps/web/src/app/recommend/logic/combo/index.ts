/** 조합 기반 30세트 생성 — 공개 API */

export { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

export {
  COMBO_RANK_SLOT_ORDER,
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
  buildBandTargetsForRankCascade,
  buildBandTargetsPerPosition,
  buildBandLadderForRankCascade,
  primaryBandTargetsFromLadder,
  bandTierForRank,
} from '@/app/recommend/logic/combo/buildBandTargets';

export {
  parseComboStrategyRank,
  sortGeneratedSetsByComboStrategy,
  orderSetsByProfileSlots,
  formatProfileRank,
  comboStrategyForRank,
  setsInProfileSlotOrder,
} from '@/app/recommend/logic/combo/orderSets';

export type { CombinationGenerationResult } from '@/app/recommend/logic/combo/generate';
export { generateCombinationBasedSets } from '@/app/recommend/logic/combo/generate';
