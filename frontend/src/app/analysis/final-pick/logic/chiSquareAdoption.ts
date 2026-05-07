import {
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from '@/app/analysis/chi-square/constants';
import { buildChiSquareResults } from '@/app/analysis/chi-square/logic/chiSquare';
import {
  deviationToBinKey,
  runChiSquareDeviationBinWalkForward,
  type DeviationBinRow,
} from '@/app/analysis/chi-square/logic/walkForwardStats';
import type { ChiSquareResult } from '@/app/analysis/chi-square/types';
import type { WinningNumberRow } from '../types';

const TOTAL_LOTTO_NUMBERS = 45;

export type ChiSquareChartDatum = {
  number: number;
  deviation: number;
  rank: number;
};

const buildBinPctMap = (allBins: readonly { binKey: string; pct: number }[]): Map<string, number> =>
  new Map(allBins.map((row) => [row.binKey, row.pct] as const));

/**
 * 음/양 편차 구분 없이, 구간 조건부 확률(%)이 높은 번호를 우선 배치한다.
 * 동점일 때는 번호 오름차순으로 고정해 결과를 결정적으로 만든다.
 */
export const rankChiSquareNumbersByConditionalProbability = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly { binKey: string; pct: number }[],
): number[] => {
  if (chiSquareResults.length === 0 || allBins.length === 0) return [];

  const pctByBin = buildBinPctMap(allBins);

  return [...chiSquareResults]
    .sort((a, b) => {
      const pctA = pctByBin.get(deviationToBinKey(a.deviation)) ?? Number.NEGATIVE_INFINITY;
      const pctB = pctByBin.get(deviationToBinKey(b.deviation)) ?? Number.NEGATIVE_INFINITY;
      if (pctB !== pctA) return pctB - pctA;
      return a.number - b.number;
    })
    .map((row) => row.number);
};

/** 조건부 확률이 정책 상한(%) 이하인지 — `roundsHit > 0`일 때만 정수식으로 판정. */
export const isChiSquareBinExcludedByConditionalPct = (bin: DeviationBinRow): boolean =>
  bin.roundsHit > 0 &&
  bin.roundsMatched * 100 <= CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR * bin.roundsHit;

/** 겹침 회차(`roundsMatched`)가 정책 상한 이하인지. */
export const isChiSquareBinExcludedByOverlapRounds = (bin: DeviationBinRow): boolean =>
  bin.roundsMatched <= CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS;

/**
 * 편차 구간 워크포워드 통계 기준으로 후보에서 제외할지 판정한다.
 * 두 조건 중 하나라도 해당하면 제외(카드·분류는 각각 따로 표시).
 */
export const isChiSquareNumberExcludedByWalkForwardBin = (bin: DeviationBinRow): boolean =>
  isChiSquareBinExcludedByConditionalPct(bin) || isChiSquareBinExcludedByOverlapRounds(bin);

/**
 * 전체 검정 결과와 워크포워드 `allBins`로, 제외 규칙을 통과한 번호만 번호 오름차순으로 반환한다.
 */
export const getChiSquareWalkForwardSurvivorNumbers = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): number[] => {
  if (chiSquareResults.length === 0 || allBins.length === 0) return [];

  const binByKey = new Map(allBins.map((b) => [b.binKey, b] as const));
  const survivors: number[] = [];
  for (const row of chiSquareResults) {
    const bin = binByKey.get(deviationToBinKey(row.deviation));
    if (!bin || isChiSquareNumberExcludedByWalkForwardBin(bin)) continue;
    survivors.push(row.number);
  }
  return survivors.sort((a, b) => a - b);
};

export type ChiSquareWalkForwardExcludedSplit = {
  /** 조건부 확률(정책 상한 % 이하)만 해당하는 번호(동시에 겹침 조건도 맞으면 이 목록에도 포함). */
  byConditionalPct: number[];
  /** 겹침 회차(정책 상한 이하)만 해당하는 번호(동시에 확률 조건도 맞으면 이 목록에도 포함). */
  byOverlapRounds: number[];
};

const sortUniqueNumbers = (nums: number[]): number[] => [...new Set(nums)].sort((a, b) => a - b);

/**
 * 워크포워드 제외를 조건부 확률 / 겹침 회차 기준으로 나눈 뒤, 각각 번호 오름차순으로 반환한다.
 * 구간 행이 없으면(`!bin`) 겹침 조건 쪽으로만 넣는다(`roundsMatched` 미정과 동일 취급).
 */
export const getChiSquareWalkForwardExcludedSplit = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): ChiSquareWalkForwardExcludedSplit => {
  if (chiSquareResults.length === 0 || allBins.length === 0) {
    return { byConditionalPct: [], byOverlapRounds: [] };
  }

  const binByKey = new Map(allBins.map((b) => [b.binKey, b] as const));
  const byConditionalPct: number[] = [];
  const byOverlapRounds: number[] = [];

  for (const row of chiSquareResults) {
    const bin = binByKey.get(deviationToBinKey(row.deviation));
    if (!bin) {
      byOverlapRounds.push(row.number);
      continue;
    }
    if (isChiSquareBinExcludedByConditionalPct(bin)) {
      byConditionalPct.push(row.number);
    }
    if (isChiSquareBinExcludedByOverlapRounds(bin)) {
      byOverlapRounds.push(row.number);
    }
  }

  return {
    byConditionalPct: sortUniqueNumbers(byConditionalPct),
    byOverlapRounds: sortUniqueNumbers(byOverlapRounds),
  };
};

/**
 * 워크포워드 제외 규칙에 해당하는 번호(두 조건 중 하나) — 번호 오름차순·중복 제거.
 * 표·차트 강조용 합집합.
 */
export const getChiSquareWalkForwardExcludedNumbers = (
  chiSquareResults: readonly ChiSquareResult[],
  allBins: readonly DeviationBinRow[],
): number[] => {
  const split = getChiSquareWalkForwardExcludedSplit(chiSquareResults, allBins);
  return sortUniqueNumbers([...split.byConditionalPct, ...split.byOverlapRounds]);
};

type FinalPickChiSquareWalkForwardContext = {
  survivors: number[];
  walkForwardExcluded: number[];
  walkForwardExcludedSplit: ChiSquareWalkForwardExcludedSplit;
};

/** 통합 분석용: 동일 워크포워드 집계로 잔여·제외 번호를 한 번에 만든다. */
const buildFinalPickChiSquareWalkForwardContext = (
  previousDrawRows: WinningNumberRow[],
  selectedMainNumbers: number[],
): FinalPickChiSquareWalkForwardContext | null => {
  if (previousDrawRows.length < 2 || selectedMainNumbers.length === 0) {
    return null;
  }
  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const chiSquareResults = buildChiSquareResults(sortedRows);
  const walkForwardSummary = runChiSquareDeviationBinWalkForward(sortedRows, {
    minPastDraws: 1,
    referenceMainNumbers: new Set(selectedMainNumbers),
  });
  const allBins = walkForwardSummary.allBins;
  const walkForwardExcludedSplit = getChiSquareWalkForwardExcludedSplit(chiSquareResults, allBins);
  return {
    survivors: getChiSquareWalkForwardSurvivorNumbers(chiSquareResults, allBins),
    walkForwardExcluded: sortUniqueNumbers([
      ...walkForwardExcludedSplit.byConditionalPct,
      ...walkForwardExcludedSplit.byOverlapRounds,
    ]),
    walkForwardExcludedSplit,
  };
};

/**
 * 통합 분석 카드용 — 연속·추세·누적 필터와 무관하게, 워크포워드 규칙만으로 제외된 번호 목록.
 */
export const getChiSquareWalkForwardExcludedNumbersFromPickInput = ({
  previousDrawRows,
  selectedMainNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
}): number[] => {
  const ctx = buildFinalPickChiSquareWalkForwardContext(previousDrawRows, selectedMainNumbers);
  return ctx?.walkForwardExcluded ?? [];
};

export type ChiSquareFinalPickSlice = {
  adopted: number[];
  /** 두 제외 사유의 합집합(중복 제거) */
  walkForwardExcluded: number[];
  walkForwardExcludedByConditionalPct: number[];
  walkForwardExcludedByOverlapRounds: number[];
};

/** 통합 분석: 워크포워드 1회로 잔여 채택·워크포워드 제외 목록을 함께 반환한다. */
export const getChiSquareFinalPickSlice = ({
  previousDrawRows,
  selectedMainNumbers,
  excludedByStreakNumbers,
  excludedByTrendNumbers,
  /** 누적 출현 극값으로 정한 번호 — 카이제곱 잔여 후보에서 제외한다. */
  accumulatedExclusionNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
  excludedByStreakNumbers: number[];
  excludedByTrendNumbers: number[];
  accumulatedExclusionNumbers: number[];
}): ChiSquareFinalPickSlice => {
  const ctx = buildFinalPickChiSquareWalkForwardContext(previousDrawRows, selectedMainNumbers);
  if (!ctx) {
    return {
      adopted: [],
      walkForwardExcluded: [],
      walkForwardExcludedByConditionalPct: [],
      walkForwardExcludedByOverlapRounds: [],
    };
  }
  const excludedSet = new Set<number>([
    ...excludedByStreakNumbers,
    ...excludedByTrendNumbers,
    ...accumulatedExclusionNumbers,
  ]);
  return {
    adopted: ctx.survivors.filter((n) => !excludedSet.has(n)),
    walkForwardExcluded: ctx.walkForwardExcluded,
    walkForwardExcludedByConditionalPct: ctx.walkForwardExcludedSplit.byConditionalPct,
    walkForwardExcludedByOverlapRounds: ctx.walkForwardExcludedSplit.byOverlapRounds,
  };
};

/**
 * 번호별 편차(O-E)와 편차 기준 순위를 차트 표시용으로 생성한다.
 * 순위는 편차 내림차순, 동률이면 번호 오름차순으로 고정한다.
 */
export const buildChiSquareChartData = (
  previousDrawRows: WinningNumberRow[],
  selectedMainNumbers: number[],
): ChiSquareChartDatum[] => {
  if (previousDrawRows.length < 2 || selectedMainNumbers.length === 0) return [];

  const sortedRows = [...previousDrawRows].sort((a, b) => a.draw_no - b.draw_no);
  const chiSquareResults = buildChiSquareResults(sortedRows);
  const walkForwardSummary = runChiSquareDeviationBinWalkForward(sortedRows, {
    minPastDraws: 1,
    referenceMainNumbers: new Set(selectedMainNumbers),
  });
  const rankedByConditionalProbability = rankChiSquareNumbersByConditionalProbability(
    chiSquareResults,
    walkForwardSummary.allBins,
  );
  const normalizedResults =
    chiSquareResults.length === TOTAL_LOTTO_NUMBERS
      ? chiSquareResults
      : Array.from({ length: TOTAL_LOTTO_NUMBERS }, (_, index) => {
          const number = index + 1;
          const existing = chiSquareResults.find((row) => row.number === number);
          return (
            existing ?? {
              number,
              observed: 0,
              expected: 0,
              deviation: 0,
              chiSquare: 0,
              isLowFreq: false,
              isHighFreq: false,
            }
          );
        });

  const rankByNumber = new Map<number, number>();
  rankedByConditionalProbability.forEach((number, index) => {
    rankByNumber.set(number, index + 1);
  });
  normalizedResults.forEach((row) => {
    if (!rankByNumber.has(row.number)) {
      rankByNumber.set(row.number, TOTAL_LOTTO_NUMBERS);
    }
  });

  return normalizedResults
    .map((row) => ({
      number: row.number,
      deviation: row.deviation,
      rank: rankByNumber.get(row.number) ?? TOTAL_LOTTO_NUMBERS,
    }))
    .sort((a, b) => a.number - b.number);
};

export const getChiSquareAdoptedNumbers = ({
  previousDrawRows,
  selectedMainNumbers,
  excludedByStreakNumbers,
  excludedByTrendNumbers,
  accumulatedExclusionNumbers,
}: {
  previousDrawRows: WinningNumberRow[];
  selectedMainNumbers: number[];
  excludedByStreakNumbers: number[];
  excludedByTrendNumbers: number[];
  accumulatedExclusionNumbers: number[];
}): number[] =>
  getChiSquareFinalPickSlice({
    previousDrawRows,
    selectedMainNumbers,
    excludedByStreakNumbers,
    excludedByTrendNumbers,
    accumulatedExclusionNumbers,
  }).adopted;
