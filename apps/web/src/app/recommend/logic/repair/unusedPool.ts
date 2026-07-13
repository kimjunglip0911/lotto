import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';
import { setKey } from '@/app/recommend/logic/combo/toSet';

/** band 무시·적게 쓴 번호 우선으로 고저 합·중복만 맞춘 6개 (3회 한도는 임시 비활성) */

const sumRangeFeasible = (
  partialSum: number,
  remaining: readonly number[],
  remainingCount: number,
  minSum: number,
  maxSum: number,
): boolean => {
  if (remainingCount === 0) return partialSum >= minSum && partialSum <= maxSum;
  if (remaining.length < remainingCount) return false;
  // 사용횟수 순 배열이어도 합 가능 여부는 번호 값 기준 min/max로 본다
  const byValue = [...remaining].sort((a, b) => a - b);
  const minRem = byValue.slice(0, remainingCount).reduce((a, b) => a + b, 0);
  const maxRem = byValue.slice(-remainingCount).reduce((a, b) => a + b, 0);
  return partialSum + minRem <= maxSum && partialSum + maxRem >= minSum;
};

const setKeyFromPicked = (picked: readonly number[]): string => setKey([...picked]);

const sortByUsageAsc = (
  nums: readonly number[],
  usage: ReadonlyMap<number, number>,
): number[] =>
  [...nums].sort((a, b) => {
    const du = (usage.get(a) ?? 0) - (usage.get(b) ?? 0);
    return du !== 0 ? du : a - b;
  });

export const buildUnusedPoolSet = (
  poolSorted: readonly number[],
  minSum: number,
  maxSum: number,
  usage: ReadonlyMap<number, number>,
  usedKeys: ReadonlySet<string>,
  avoidKeys: ReadonlySet<string> = new Set(),
): number[] | null => {
  const avail = sortByUsageAsc(filterUsageAvail([...poolSorted], usage), usage);
  if (avail.length < 6) return null;

  const search = (from: number, picked: number[]): number[] | null => {
    const partialSum = picked.reduce((a, b) => a + b, 0);
    const need = 6 - picked.length;
    if (!sumRangeFeasible(partialSum, avail.slice(from), need, minSum, maxSum)) return null;

    if (picked.length === 6) {
      const key = setKeyFromPicked(picked);
      if (usedKeys.has(key) || avoidKeys.has(key)) return null;
      return [...picked];
    }
    for (let i = from; i < avail.length; i++) {
      picked.push(avail[i]!);
      const found = search(i + 1, picked);
      if (found) return found;
      picked.pop();
    }
    return null;
  };

  return search(0, []);
};

/** rank 19~20: 미사용(0회) 번호 우선·고저 무시·중복만 (3회 한도 임시 비활성) */

const searchSixNoSum = (
  avail: readonly number[],
  usedKeys: ReadonlySet<string>,
): number[] | null => {
  if (avail.length < 6) return null;

  const search = (from: number, picked: number[]): number[] | null => {
    if (picked.length === 6) {
      if (usedKeys.has(setKeyFromPicked(picked))) return null;
      return [...picked];
    }
    for (let i = from; i < avail.length; i++) {
      picked.push(avail[i]!);
      const found = search(i + 1, picked);
      if (found) return found;
      picked.pop();
    }
    return null;
  };

  return search(0, []);
};

export const buildTailUnusedSet = (
  poolSorted: readonly number[],
  usage: ReadonlyMap<number, number>,
  usedKeys: ReadonlySet<string>,
): number[] | null => {
  const neverUsed = [...poolSorted]
    .filter((n) => (usage.get(n) ?? 0) === 0)
    .sort((a, b) => a - b);
  const fromNeverUsed = searchSixNoSum(neverUsed, usedKeys);
  if (fromNeverUsed) return fromNeverUsed;

  const avail = sortByUsageAsc(filterUsageAvail([...poolSorted], usage), usage);
  return searchSixNoSum(avail, usedKeys);
};
