import { useMemo } from 'react';
import { extractMainNumbers } from '../types/winRow';
import type { useFinalPickData } from './useFinalPickData';
import { ADOPTED_TARGET_COUNT } from '../constants';

type Data = ReturnType<typeof useFinalPickData>;

/** FinalPickMain 표시용 파생 Set·목록. */
export const useFinalPickView = (data: Data) => {
  const selectedMainNumbers = useMemo(
    () => (data.selectedWinningNumber ? extractMainNumbers(data.selectedWinningNumber) : []),
    [data.selectedWinningNumber],
  );
  const mainWinningNumberSet = useMemo(() => new Set(selectedMainNumbers), [selectedMainNumbers]);
  const adoptedAllNumbers = useMemo(
    () => [...data.adoptedByChiSquareNumbers].sort((a, b) => a - b),
    [data.adoptedByChiSquareNumbers],
  );
  const adoptedSummaryTargetCount =
    adoptedAllNumbers.length > 0 ? adoptedAllNumbers.length : ADOPTED_TARGET_COUNT;
  const chiSquareWalkForwardExcludedForChart = useMemo(
    () =>
      [
        ...new Set([
          ...data.excludedByChiSquareWalkForwardConditionalPct,
          ...data.excludedByChiSquareWalkForwardOverlapRounds,
        ]),
      ].sort((a, b) => a - b),
    [
      data.excludedByChiSquareWalkForwardConditionalPct,
      data.excludedByChiSquareWalkForwardOverlapRounds,
    ],
  );

  return {
    selectedMainNumbers,
    mainWinningNumberSet,
    adoptedAllNumbers,
    adoptedSummaryTargetCount,
    chiSquareWalkForwardExcludedForChart,
  };
};
