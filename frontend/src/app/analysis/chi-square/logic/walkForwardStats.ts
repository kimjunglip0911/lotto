import { CHI_SQUARE_THRESHOLD, NUMBERS_PER_DRAW, TOTAL_NUMBERS } from '../constants';
import type { ChiSquareResult, WinningNumberRow } from '../types';
import {
  pickFirstNumbersBySignedDeviationDescending,
  pickFirstNumbersBySignedDeviationOrder,
  selectAdoptedBySignedDeviationSkippingExcluded,
  selectAdoptedBySignedDeviationSkippingExcludedDescending,
} from './chiSquare';

/** 이전 회차 수가 `pastDraws`일 때 번호별 O·E·편차·χ² (회차당 7개 추첨, 보너스 포함 집계). */
export const buildChiSquareResultsFromCounts = (
  counts: readonly number[],
  pastDraws: number
): ChiSquareResult[] => {
  const expected = (pastDraws * NUMBERS_PER_DRAW) / TOTAL_NUMBERS;
  return counts.map((observed, index) => {
    const deviation = observed - expected;
    const chiSquare = expected > 0 ? (deviation * deviation) / expected : 0;
    return {
      number: index + 1,
      observed,
      expected,
      deviation,
      chiSquare,
      isLowFreq: observed < expected && chiSquare >= CHI_SQUARE_THRESHOLD,
      isHighFreq: observed > expected && chiSquare >= CHI_SQUARE_THRESHOLD,
    };
  });
};

const addRowToCounts = (row: WinningNumberRow, counts: number[]): void => {
  const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
  for (const num of nums) {
    if (num >= 1 && num <= TOTAL_NUMBERS) {
      counts[num - 1] += 1;
    }
  }
};

const mainSix = (row: WinningNumberRow): readonly [number, number, number, number, number, number] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

const hitsSet = (main: readonly number[], picked: readonly number[]): boolean => {
  const s = new Set(picked);
  return main.some((n) => s.has(n));
};

/** 상대편차 %: E>0일 때만, 그 외는 null(구간 미분류로 취급). */
const relativeDeviationPercent = (r: ChiSquareResult): number | null => {
  if (r.expected <= 0) return null;
  return (r.deviation / r.expected) * 100;
};

/** §2: [-10,0), [0,+10] (0은 양쪽 중 양 구간만). 본번호 6개 기준 배타 분류. */
export const classifyDrawExclusiveBucket = (
  main: readonly number[],
  resultsByNumber: Map<number, ChiSquareResult>
): 'neg' | 'pos' | 'out' => {
  let hasNeg = false;
  let hasPos = false;
  for (const num of main) {
    const r = resultsByNumber.get(num);
    if (!r) continue;
    const p = relativeDeviationPercent(r);
    if (p === null) continue;
    if (p >= -10 && p < 0) {
      hasNeg = true;
    } else if (p >= 0 && p <= 10) {
      hasPos = true;
    }
  }
  if (hasNeg) return 'neg';
  if (hasPos) return 'pos';
  return 'out';
};

export type ChiSquareWalkForwardSummary = {
  /** 적중률 분모가 된 목표 회차 수 */
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
  /**
   * `sortedRows[i]`를 목표 회차로 집계할 때 최소 이전 회차 수(기본 1 = 두 번째 행부터).
   * `i >= minPastDraws`일 때만 분모에 포함한다.
   */
  minPastDraws?: number;
};

const REL_PCT_BIN_WIDTH = 5;
const REL_PCT_BIN_MIN = -100;
const REL_PCT_BIN_MAX_EXCLUSIVE = 100;

/** 상대편차(%)를 5% 폭 반개구간에 매핑한다. `p < -100`, `p ≥ 100`은 별도 키. */
export const relPctToBinKey = (p: number): string => {
  if (p < REL_PCT_BIN_MIN) return 'lt_-100';
  if (p >= REL_PCT_BIN_MAX_EXCLUSIVE) return 'ge_100';
  const start = Math.floor(p / REL_PCT_BIN_WIDTH) * REL_PCT_BIN_WIDTH;
  return `b_${start}`;
};

export type RelPctBinRow = {
  /** 정렬용 (예 lt_-100, b_-100, ge_100) */
  binKey: string;
  /** 표시용 구간 문자열 */
  label: string;
  /** 해당 회차에서 본번호 6개 중 이 구간에 속하는 번호가 1개 이상인 회차 수 */
  hits: number;
  /** 분모 대비 비율(%) */
  pct: number;
};

export type RelPctBinWalkForwardSummary = {
  denominator: number;
  bins: RelPctBinRow[];
};

/** 음의 상대편차 구간(`p < −100%`, `[−100%, −95%)` … `[−5%, 0%)`)이면 true. */
export const isNegativeRelPctBinKey = (binKey: string): boolean => {
  if (binKey === 'lt_-100') return true;
  if (binKey === 'ge_100') return false;
  if (binKey.startsWith('b_')) {
    const start = Number(binKey.slice(2));
    return Number.isFinite(start) && start < 0;
  }
  return false;
};

export type SplitSortedRelPctBins = {
  denominator: number;
  negBins: RelPctBinRow[];
  posBins: RelPctBinRow[];
};

/** 음/양 구간으로 나누고 각각 비율(%) 내림차순으로 정렬한다. */
export const splitAndSortRelPctBins = (summary: RelPctBinWalkForwardSummary): SplitSortedRelPctBins => {
  const negBins: RelPctBinRow[] = [];
  const posBins: RelPctBinRow[] = [];
  for (const row of summary.bins) {
    if (isNegativeRelPctBinKey(row.binKey)) negBins.push(row);
    else posBins.push(row);
  }
  const byPctDesc = (a: RelPctBinRow, b: RelPctBinRow) =>
    b.pct - a.pct || a.binKey.localeCompare(b.binKey);
  negBins.sort(byPctDesc);
  posBins.sort(byPctDesc);
  return { denominator: summary.denominator, negBins, posBins };
};

const orderedRelPctBinKeys = (): string[] => {
  const keys: string[] = ['lt_-100'];
  for (let start = REL_PCT_BIN_MIN; start < REL_PCT_BIN_MAX_EXCLUSIVE; start += REL_PCT_BIN_WIDTH) {
    keys.push(`b_${start}`);
  }
  keys.push('ge_100');
  return keys;
};

const labelForRelPctBinKey = (key: string): string => {
  if (key === 'lt_-100') return 'p < −100%';
  if (key === 'ge_100') return 'p ≥ 100%';
  if (key.startsWith('b_')) {
    const start = Number(key.slice(2));
    const end = start + REL_PCT_BIN_WIDTH;
    return `[${start}%, ${end}%)`;
  }
  return key;
};

/**
 * 워크포워드: 각 목표 회차마다 직전 누적으로 본번호 6개의 상대편차 %를 구한 뒤,
 * **5% 단위 구간**마다「그 구간에 번호가 1개 이상 있으면」해당 회차를 1회 카운트한다(구간 간 중복 가능).
 */
export const runChiSquareRelPct5BinWalkForward = (
  sortedRows: WinningNumberRow[],
  options?: RunChiSquareWalkForwardOptions
): RelPctBinWalkForwardSummary => {
  const minPastDraws = options?.minPastDraws ?? 1;
  const rows = [...sortedRows].sort((a, b) => a.draw_no - b.draw_no);
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);

  const keys = orderedRelPctBinKeys();
  const hitMap = new Map<string, number>();
  for (const k of keys) hitMap.set(k, 0);

  let denominator = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i >= minPastDraws) {
      const pastDraws = i;
      const results = buildChiSquareResultsFromCounts(counts, pastDraws);
      const resultsByNumber = new Map(results.map((r) => [r.number, r]));

      const touched = new Set<string>();
      for (const num of mainSix(rows[i])) {
        const r = resultsByNumber.get(num);
        if (!r) continue;
        const p = relativeDeviationPercent(r);
        if (p === null) continue;
        touched.add(relPctToBinKey(p));
      }
      for (const k of touched) {
        hitMap.set(k, (hitMap.get(k) ?? 0) + 1);
      }
      denominator += 1;
    }
    addRowToCounts(rows[i], counts);
  }

  const pct = (h: number) => (denominator > 0 ? (h / denominator) * 100 : 0);
  const bins: RelPctBinRow[] = keys.map((binKey) => {
    const hits = hitMap.get(binKey) ?? 0;
    return {
      binKey,
      label: labelForRelPctBinKey(binKey),
      hits,
      pct: pct(hits),
    };
  });

  return { denominator, bins };
};

/**
 * `draw_no` 오름차순 정렬된 전체 당첨 행에 대해 워크포워드 집계.
 * 각 목표 행 `R`: `R`보다 앞선 행만으로 편차를 계산한 뒤, `R`의 본번호 6개로 적중·구간을 판정한다.
 */
export const runChiSquareWalkForward = (
  sortedRows: WinningNumberRow[],
  options?: RunChiSquareWalkForwardOptions
): ChiSquareWalkForwardSummary => {
  const minPastDraws = options?.minPastDraws ?? 1;

  const rows = [...sortedRows].sort((a, b) => a.draw_no - b.draw_no);
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);

  let hitLowest4 = 0;
  let hitLowest4SkipNext4 = 0;
  let hitHighest4 = 0;
  let hitHighest4SkipNext4 = 0;
  let bucketNeg = 0;
  let bucketPos = 0;
  let bucketOut = 0;
  let denominator = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i >= minPastDraws) {
      const pastDraws = i;
      const results = buildChiSquareResultsFromCounts(counts, pastDraws);
      const resultsByNumber = new Map(results.map((r) => [r.number, r]));

      const bottom4 = pickFirstNumbersBySignedDeviationOrder(results, 4);
      const excludeLow = new Set(bottom4);
      const nextAfterLow = selectAdoptedBySignedDeviationSkippingExcluded(results, excludeLow);
      const top4 = pickFirstNumbersBySignedDeviationDescending(results, 4);
      const excludeHigh = new Set(top4);
      const nextAfterHigh = selectAdoptedBySignedDeviationSkippingExcludedDescending(results, excludeHigh);

      const m6 = mainSix(rows[i]);

      if (hitsSet(m6, bottom4)) hitLowest4 += 1;
      if (nextAfterLow !== null && hitsSet(m6, nextAfterLow)) hitLowest4SkipNext4 += 1;
      if (hitsSet(m6, top4)) hitHighest4 += 1;
      if (nextAfterHigh !== null && hitsSet(m6, nextAfterHigh)) hitHighest4SkipNext4 += 1;

      const bucket = classifyDrawExclusiveBucket(m6, resultsByNumber);
      if (bucket === 'neg') bucketNeg += 1;
      else if (bucket === 'pos') bucketPos += 1;
      else bucketOut += 1;

      denominator += 1;
    }

    addRowToCounts(rows[i], counts);
  }

  const pct = (hits: number) => (denominator > 0 ? (hits / denominator) * 100 : 0);

  return {
    denominator,
    hitLowest4Pct: pct(hitLowest4),
    hitLowest4SkipNext4Pct: pct(hitLowest4SkipNext4),
    hitHighest4Pct: pct(hitHighest4),
    hitHighest4SkipNext4Pct: pct(hitHighest4SkipNext4),
    bucketNegPct: pct(bucketNeg),
    bucketPosPct: pct(bucketPos),
    bucketOutPct: pct(bucketOut),
    raw: {
      hitLowest4,
      hitLowest4SkipNext4,
      hitHighest4,
      hitHighest4SkipNext4,
      bucketNeg,
      bucketPos,
      bucketOut,
    },
  };
};
