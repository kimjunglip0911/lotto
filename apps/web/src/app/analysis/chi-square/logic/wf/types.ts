import type { ChiSquareResult } from '../../types';

export type ChiSquareWalkForwardSummary = {
  denominator: number;
  hitLowest4Pct: number;
  hitLowest4SkipNext4Pct: number;
  hitHighest4Pct: number;
  hitHighest4SkipNext4Pct: number;
  bucketNegPct: number;
  bucketPosPct: number;
  bucketOutPct: number;
  raw: {
    hitLowest4: number;
    hitLowest4SkipNext4: number;
    hitHighest4: number;
    hitHighest4SkipNext4: number;
    bucketNeg: number;
    bucketPos: number;
    bucketOut: number;
  };
};

export type RunChiSquareWalkForwardOptions = {
  minPastDraws?: number;
  referenceMainNumbers?: ReadonlySet<number>;
};

export type DeviationBinRow = {
  binKey: string;
  label: string;
  hits: number;
  roundsHit: number;
  roundsMatched: number;
  pct: number;
};

export type DeviationBinWalkForwardSummary = {
  denominator: number;
  targetRoundCount: number;
  bins: DeviationBinRow[];
  allBins: DeviationBinRow[];
};

export type SplitSortedDeviationBins = {
  denominator: number;
  targetRoundCount: number;
  negBins: DeviationBinRow[];
  posBins: DeviationBinRow[];
};

export type { ChiSquareResult };
