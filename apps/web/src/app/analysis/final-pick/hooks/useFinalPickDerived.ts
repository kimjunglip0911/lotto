import { useMemo } from 'react';
import { buildNumberCounts } from '@/app/analysis/accu-nums/logic/numCounts';
import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/run-streak/logic/consec';
import { getAccumulatedExclusionNumbers, type AccumulatedExclusionResult } from '../logic/accuAdopt';
import { getChiSquareFinalPickSlice } from '../logic/chiWf';
import { pickReferenceMainNumbers } from '../logic/pickMainNums';
import type { WinningNumberRow } from '../types/winRow';

type Opts = {
  previousDrawRows: WinningNumberRow[];
  searchedDraw: string;
  selectedWinningNumber: WinningNumberRow | null;
};

export type FinalPickDerived = {
  excludedByStreakNumbers: number[];
  accumulatedExclusion: AccumulatedExclusionResult;
  adoptedByChiSquareNumbers: number[];
  excludedByChiSquareWalkForwardConditionalPct: number[];
  excludedByChiSquareWalkForwardOverlapRounds: number[];
  comprehensiveChartCounts: number[];
  comprehensiveChartAnalyzedDrawCount: number;
};

/** 연속·누적·카이·차트 파생값 — 조회 세션 기준. */
export const useFinalPickDerived = ({
  previousDrawRows,
  searchedDraw,
  selectedWinningNumber,
}: Opts): FinalPickDerived => {
  const excludedByStreakNumbers = useMemo(() => {
    if (previousDrawRows.length === 0) return [];
    const drawNo = Number(searchedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 2) return [];
    return getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo);
  }, [previousDrawRows, searchedDraw]);

  const accumulatedExclusion = useMemo(
    () => getAccumulatedExclusionNumbers({ previousDrawRows }),
    [previousDrawRows],
  );

  const selectedMainNumbers = useMemo(
    () => pickReferenceMainNumbers(selectedWinningNumber, previousDrawRows),
    [previousDrawRows, selectedWinningNumber],
  );

  const chiSlice = useMemo(
    () =>
      getChiSquareFinalPickSlice({
        previousDrawRows,
        selectedMainNumbers,
        excludedByStreakNumbers,
        accumulatedExclusionNumbers: accumulatedExclusion.excludedUnique,
      }),
    [accumulatedExclusion, excludedByStreakNumbers, previousDrawRows, selectedMainNumbers],
  );

  const chart = useMemo(() => {
    if (previousDrawRows.length === 0) {
      return { comprehensiveChartCounts: [] as number[], comprehensiveChartAnalyzedDrawCount: 0 };
    }
    return {
      comprehensiveChartCounts: buildNumberCounts(previousDrawRows),
      comprehensiveChartAnalyzedDrawCount: previousDrawRows.length,
    };
  }, [previousDrawRows]);

  return {
    excludedByStreakNumbers,
    accumulatedExclusion,
    adoptedByChiSquareNumbers: chiSlice.adopted,
    excludedByChiSquareWalkForwardConditionalPct: chiSlice.walkForwardExcludedByConditionalPct,
    excludedByChiSquareWalkForwardOverlapRounds: chiSlice.walkForwardExcludedByOverlapRounds,
    ...chart,
  };
};
