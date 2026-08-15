import type { WinningNumberRow } from '@/lib/accu-nums/types';
import type { PositionBandRankRow } from '@/app/combination/types';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { buildPoolByBand, buildHistCounts } from '@/app/recommend/logic/repair';
import {
  buildPositionDrawCountLookup,
  buildPositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';

type CtxArgs = {
  poolSorted: readonly number[];
  minSum: number;
  maxSum: number;
  targetsByRank: Map<number, number[]>;
  laddersByRank: Map<number, number[][]>;
  appearHist: readonly WinningNumberRow[];
  referenceDrawNo: number;
  rankedRows: readonly PositionBandRankRow[];
  repairYieldEvery: number;
  pastWinningKeys: ReadonlySet<string>;
};

export const makeFillCtx = (args: CtxArgs): FillCtx => {
  const usage = new Map<number, number>();
  for (const n of args.poolSorted) usage.set(n, 0);
  return {
    poolByBand: buildPoolByBand([...args.poolSorted]),
    minSum: args.minSum,
    maxSum: args.maxSum,
    targetsByRank: args.targetsByRank,
    laddersByRank: args.laddersByRank,
    usedKeys: new Set<string>(),
    usage,
    innerSlotUsage: new Map<string, number>(),
    histCounts: buildHistCounts(args.appearHist, args.referenceDrawNo),
    positionRankLookup: buildPositionRankLookup(args.rankedRows),
    positionDrawCountLookup: buildPositionDrawCountLookup(args.rankedRows),
    repairYieldEvery: args.repairYieldEvery,
    profileSlots: Array.from({ length: COMBO_RANK_SLOT_ORDER.length }, () => null),
    pastWinningKeys: args.pastWinningKeys,
  };
};
