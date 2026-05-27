import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';

/** 채택 풀을 band별·평탄 목록으로 만든다 */

export const buildHistCounts = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): number[] => {
  const counts = Array.from({ length: 45 }, () => 0);
  for (const row of rows) {
    if (row.draw_no >= referenceDrawNo) continue;
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    for (const n of mains) {
      if (n >= 1 && n <= 45) counts[n - 1]!++;
    }
  }
  return counts;
};

export const adoptedPoolSize = (poolByBand: ReadonlyMap<number, number[]>): number => {
  let total = 0;
  for (const list of poolByBand.values()) total += list.length;
  return total;
};

export const buildPoolByBand = (poolSorted: readonly number[]): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  for (const n of poolSorted) {
    const b = numberToBandIndex(n);
    const list = map.get(b) ?? [];
    list.push(n);
    map.set(b, list);
  }
  return map;
};

export const flatAdoptedPool = (poolByBand: ReadonlyMap<number, number[]>): number[] => {
  const set = new Set<number>();
  for (const list of poolByBand.values()) {
    for (const n of list) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
};
