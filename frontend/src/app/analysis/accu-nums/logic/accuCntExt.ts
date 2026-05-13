import { ACCUMULATED_STRATEGY_WINDOW_DRAWS } from '../constants';
import type { WinningNumberRow } from '../types';
import { buildNumberCounts } from './numCounts';

/** 2년·전체 구간 각 출현 최다/최소로 뽑은 네 슬롯과 고유 제외 번호 목록. */
export type AccumulatedCountExclusionResult = {
  twoYearHighest: number | null;
  twoYearLowest: number | null;
  allTimeHighest: number | null;
  allTimeLowest: number | null;
  /** 슬롯 기준 고유 번호, 오름차순(동일 번호가 여러 슬롯이면 4 미만일 수 있음). */
  excludedUnique: number[];
};

/** 출현 횟수 최대인 번호 하나. 동률이면 번호 오름차순 우선(가장 작은 번호). */
function pickHighestCountNumber(counts: readonly number[]): number | null {
  if (counts.length === 0) return null;
  let bestNum = 1;
  let bestCount = counts[0] ?? 0;
  for (let i = 1; i < counts.length; i += 1) {
    const n = i + 1;
    const c = counts[i] ?? 0;
    if (c > bestCount || (c === bestCount && n < bestNum)) {
      bestNum = n;
      bestCount = c;
    }
  }
  return bestNum;
}

/** 출현 횟수 최소인 번호 하나. 동률이면 번호 오름차순 우선(가장 작은 번호). */
function pickLowestCountNumber(counts: readonly number[]): number | null {
  if (counts.length === 0) return null;
  let bestNum = 1;
  let bestCount = counts[0] ?? 0;
  for (let i = 1; i < counts.length; i += 1) {
    const n = i + 1;
    const c = counts[i] ?? 0;
    if (c < bestCount || (c === bestCount && n < bestNum)) {
      bestNum = n;
      bestCount = c;
    }
  }
  return bestNum;
}

/**
 * 누적 출현 횟수 기준 제외 후보: 직전 104회(2년)·전체 각각 최다 1·최소 1.
 * 선택 회차 미만의 당첨 행만 사용한다(호출부에서 이미 필터된 배열).
 */
export function buildAccumulatedCountExclusionResult(
  previousDrawRows: WinningNumberRow[]
): AccumulatedCountExclusionResult {
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
    (x): x is number => x !== null
  );
  const excludedUnique = [...new Set(slots)].sort((a, b) => a - b);

  return {
    twoYearHighest,
    twoYearLowest,
    allTimeHighest,
    allTimeLowest,
    excludedUnique,
  };
}
