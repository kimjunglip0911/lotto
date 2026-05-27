import { NUMBERS_PER_DRAW, TOTAL_NUMBERS } from '../constants';
import type { ChiSquareResult, WinningNumberRow } from '../types';
import { mapCountsToChiResults } from './chiSqCore';
import { addRowToCounts } from './rowCounts';

export const buildChiSquareResults = (rows: WinningNumberRow[]): ChiSquareResult[] => {
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);
  for (const row of rows) addRowToCounts(row, counts);
  return mapCountsToChiResults(counts, rows.length, NUMBERS_PER_DRAW, TOTAL_NUMBERS);
};

export const pickFirstNumbersBySignedDeviationOrder = (
  results: ChiSquareResult[],
  count: number,
): readonly number[] => {
  if (results.length === 0 || count <= 0) return [];
  const sorted = [...results].sort((a, b) => a.deviation - b.deviation || a.number - b.number);
  return sorted.slice(0, Math.min(count, sorted.length)).map((r) => r.number);
};

export const selectAdoptedBySignedDeviationSkippingExcluded = (
  results: ChiSquareResult[],
  exclude?: ReadonlySet<number>,
): readonly [number, number, number, number] | null => {
  if (results.length === 0) return null;
  const sorted = [...results].sort((a, b) => a.deviation - b.deviation || a.number - b.number);
  const picked = new Set<number>();
  const out: number[] = [];
  for (const row of sorted) {
    if (picked.has(row.number) || exclude?.has(row.number)) continue;
    picked.add(row.number);
    out.push(row.number);
    if (out.length === 4) break;
  }
  if (out.length !== 4) return null;
  const ascending = [...out].sort((a, b) => a - b);
  return [ascending[0], ascending[1], ascending[2], ascending[3]];
};

export const pickFirstNumbersBySignedDeviationDescending = (
  results: ChiSquareResult[],
  count: number,
): readonly number[] => {
  if (results.length === 0 || count <= 0) return [];
  const sorted = [...results].sort((a, b) => b.deviation - a.deviation || a.number - b.number);
  return sorted.slice(0, Math.min(count, sorted.length)).map((r) => r.number);
};

export const selectAdoptedBySignedDeviationSkippingExcludedDescending = (
  results: ChiSquareResult[],
  exclude?: ReadonlySet<number>,
): readonly [number, number, number, number] | null => {
  if (results.length === 0) return null;
  const sorted = [...results].sort((a, b) => b.deviation - a.deviation || a.number - b.number);
  const picked = new Set<number>();
  const out: number[] = [];
  for (const row of sorted) {
    if (picked.has(row.number) || exclude?.has(row.number)) continue;
    picked.add(row.number);
    out.push(row.number);
    if (out.length === 4) break;
  }
  if (out.length !== 4) return null;
  const ascending = [...out].sort((a, b) => a - b);
  return [ascending[0], ascending[1], ascending[2], ascending[3]];
};

export const getMaxAbsDeviation = (results: ChiSquareResult[]): number => {
  if (results.length === 0) return 1;
  return Math.max(...results.map((r) => Math.abs(r.deviation)), 1);
};
