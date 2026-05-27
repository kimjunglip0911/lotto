import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';
import type { WinningNumberRow } from '../types';
import { pickHighestCountNumber, pickLowestCountNumber } from './accuExtPick';
import { buildNumberCounts } from './numCounts';

/** 2년·전체 구간 각 출현 최다/최소로 뽑은 네 슬롯과 고유 제외 번호 목록. */
export type AccumulatedCountExclusionResult = {
  twoYearHighest: number | null;
  twoYearLowest: number | null;
  allTimeHighest: number | null;
  allTimeLowest: number | null;
  excludedUnique: number[];
};

/** 직전 104회(2년)·전체 각각 최다 1·최소 1 슬롯으로 제외 후보를 만든다. */
export const buildAccumulatedCountExclusionResult = (
  previousDrawRows: WinningNumberRow[],
): AccumulatedCountExclusionResult => {
  if (previousDrawRows.length === 0) {
    return {
      twoYearHighest: null,
      twoYearLowest: null,
      allTimeHighest: null,
      allTimeLowest: null,
      excludedUnique: [],
    };
  }

  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const twoYearRows = sortedRows.slice(-ACCUMULATED_STRATEGY_WINDOW_DRAWS);
  const twoYearCounts = buildNumberCounts(twoYearRows);
  const allTimeCounts = buildNumberCounts(sortedRows);

  const twoYearHighest = pickHighestCountNumber(twoYearCounts);
  const twoYearLowest = pickLowestCountNumber(twoYearCounts);
  const allTimeHighest = pickHighestCountNumber(allTimeCounts);
  const allTimeLowest = pickLowestCountNumber(allTimeCounts);

  const slots = [twoYearHighest, twoYearLowest, allTimeHighest, allTimeLowest].filter(
    (x): x is number => x !== null,
  );
  const excludedUnique = [...new Set(slots)].sort((a, b) => a - b);

  return { twoYearHighest, twoYearLowest, allTimeHighest, allTimeLowest, excludedUnique };
};
