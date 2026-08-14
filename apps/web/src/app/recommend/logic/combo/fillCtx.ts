import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type {
  PositionDrawCountLookup,
  PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';

/** 슬롯 채우기 공유 컨텍스트 */

export type FillCtx = {
  poolByBand: ReadonlyMap<number, number[]>;
  zeroPoolByBand: ReadonlyMap<number, number[]>;
  minSum: number;
  maxSum: number;
  targetsByRank: Map<number, number[]>;
  laddersByRank: Map<number, number[][]>;
  usedKeys: Set<string>;
  usage: Map<number, number>;
  innerSlotUsage: Map<string, number>;
  histCounts: readonly number[];
  positionRankLookup: PositionRankLookup;
  positionDrawCountLookup: PositionDrawCountLookup;
  gapRankLookup: GapRankLookup;
  zeroGapRankLookup: GapRankLookup;
  leftGapLookup: GapRankLookup;
  leftPoolByBand: ReadonlyMap<number, number[]>;
  repairYieldEvery: number;
  profileSlots: (GeneratedSet | null)[];
  pastWinningKeys: ReadonlySet<string>;
};
