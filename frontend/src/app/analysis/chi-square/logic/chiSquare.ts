import { CHI_SQUARE_THRESHOLD, NUMBERS_PER_DRAW, TOTAL_NUMBERS } from '../constants';
import type { ChiSquareResult, WinningNumberRow } from '../types';

export const buildChiSquareResults = (rows: WinningNumberRow[]): ChiSquareResult[] => {
  const n = rows.length;
  const expected = (n * NUMBERS_PER_DRAW) / TOTAL_NUMBERS;
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);

  for (const row of rows) {
    // 본번호 6개만 집계(기대값 E도 회차당 6과 정합).
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        counts[num - 1] += 1;
      }
    }
  }

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

/**
 * 편차(O−E) **값** 오름차순(가장 작은·가장 음수에 가까운 순), 동률 시 번호 오름차순으로 앞에서 `count`개 번호.
 * 「|편차|가 가장 작다」와 다르다(−30이 +1보다 먼저 온다).
 */
export const pickFirstNumbersBySignedDeviationOrder = (
  results: ChiSquareResult[],
  count: number
): readonly number[] => {
  if (results.length === 0 || count <= 0) {
    return [];
  }
  const sorted = [...results].sort((a, b) => a.deviation - b.deviation || a.number - b.number);
  const take = Math.min(count, sorted.length);
  return sorted.slice(0, take).map((r) => r.number);
};

/**
 * 전체 번호를 편차(O−E) 오름차순으로 한 번만 순회하며, `exclude`에 없는 항목을 앞에서 4개 고른다.
 * 제외 집합이 「편차가 가장 작은 4개」이면 그 **다음** 순위(예: −25 이후)가 채택된다.
 * 동일 번호가 중복 행으로 들어오면 건너뛴다. 화면 표기용으로 최종 4개는 번호 오름차순 정렬해 반환한다.
 */
export const selectAdoptedBySignedDeviationSkippingExcluded = (
  results: ChiSquareResult[],
  exclude?: ReadonlySet<number>
): readonly [number, number, number, number] | null => {
  if (results.length === 0) {
    return null;
  }

  const sorted = [...results].sort((a, b) => a.deviation - b.deviation || a.number - b.number);
  const picked = new Set<number>();
  const out: number[] = [];

  for (const row of sorted) {
    if (picked.has(row.number)) {
      continue;
    }
    if (exclude?.has(row.number)) {
      continue;
    }
    picked.add(row.number);
    out.push(row.number);
    if (out.length === 4) {
      break;
    }
  }

  if (out.length !== 4) {
    return null;
  }

  const ascending = [...out].sort((a, b) => a - b);
  return [ascending[0], ascending[1], ascending[2], ascending[3]];
};

/**
 * 편차(O−E) **값** 내림차순(가장 큰 양수 우선), 동률 시 번호 오름차순으로 앞에서 `count`개 번호.
 */
export const pickFirstNumbersBySignedDeviationDescending = (
  results: ChiSquareResult[],
  count: number
): readonly number[] => {
  if (results.length === 0 || count <= 0) {
    return [];
  }
  const sorted = [...results].sort((a, b) => b.deviation - a.deviation || a.number - b.number);
  const take = Math.min(count, sorted.length);
  return sorted.slice(0, take).map((r) => r.number);
};

/**
 * 편차(O−E) 내림차순으로 순회하며 `exclude`에 없는 항목을 앞에서 4개 고른다.
 * 화면 표기용으로 최종 4개는 번호 오름차순 정렬해 반환한다.
 */
export const selectAdoptedBySignedDeviationSkippingExcludedDescending = (
  results: ChiSquareResult[],
  exclude?: ReadonlySet<number>
): readonly [number, number, number, number] | null => {
  if (results.length === 0) {
    return null;
  }

  const sorted = [...results].sort((a, b) => b.deviation - a.deviation || a.number - b.number);
  const picked = new Set<number>();
  const out: number[] = [];

  for (const row of sorted) {
    if (picked.has(row.number)) {
      continue;
    }
    if (exclude?.has(row.number)) {
      continue;
    }
    picked.add(row.number);
    out.push(row.number);
    if (out.length === 4) {
      break;
    }
  }

  if (out.length !== 4) {
    return null;
  }

  const ascending = [...out].sort((a, b) => a - b);
  return [ascending[0], ascending[1], ascending[2], ascending[3]];
};

export const getMaxAbsDeviation = (results: ChiSquareResult[]): number => {
  if (results.length === 0) return 1;
  return Math.max(...results.map((r) => Math.abs(r.deviation)), 1);
};
