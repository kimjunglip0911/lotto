import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/run-streak/logic/consec';
import { getAccumulatedExclusionNumbers } from '@/app/analysis/final-pick/logic/accuAdopt';
import { getChiSquareFinalPickSlice } from '@/app/analysis/final-pick/logic/chiWf';
import type { WinningNumberRow } from '@/app/analysis/final-pick/types/winRow';
import type { FinalPickAdoptedResult } from '@/app/recommend/logic/adopt/adoptTypes';

/** 이력·본번호로 통합 분석과 동일한 채택 슬라이스를 계산한다 */

export const buildAdoptedSlice = (
  previousDrawRows: WinningNumberRow[],
  main: number[],
  drawNo: number,
  infoMessage: string | null,
): FinalPickAdoptedResult => {
  const excludedByStreakNumbers = getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo);
  const accumulated = getAccumulatedExclusionNumbers({ previousDrawRows });
  const slice = getChiSquareFinalPickSlice({
    previousDrawRows,
    selectedMainNumbers: main,
    excludedByStreakNumbers,
    accumulatedExclusionNumbers: accumulated.excludedUnique,
  });
  return { adopted: slice.adopted, previousDrawRows, error: null, infoMessage };
};
