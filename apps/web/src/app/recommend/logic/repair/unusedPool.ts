import { filterUsageAvail } from '@/app/recommend/logic/repair/usageLimit';
import { setKey } from '@/app/recommend/logic/combo/toSet';

/** band 무시·한도 남은 번호(적게 쓴 순)로 고저 합·중복만 맞춘 6개 */

const sumRangeFeasible = (
  partialSum: number,
  remainingSorted: readonly number[],
  remainingCount: number,
  minSum: number,
  maxSum: number,
): boolean => {
  if (remainingCount === 0) return partialSum >= minSum && partialSum <= maxSum;
  if (remainingSorted.length < remainingCount) return false;
  const minRem = remainingSorted.slice(0, remainingCount).reduce((a, b) => a + b, 0);
  const maxRem = remainingSorted.slice(-remainingCount).reduce((a, b) => a + b, 0);
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

/** rank 19~20: 미사용(0회) 번호 우선·고저 무시·중복·3회 한도만 */

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
