import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { sortedNumsFromSet } from '@/app/recommend/logic/combo/toSet';

/** 슬롯 구간에 한 번이라도 나온 번호 */

export const numsUsedInSlots = (
  slots: readonly (GeneratedSet | null)[],
  from: number,
  toExclusive: number,
): Set<number> => {
  const used = new Set<number>();
  for (let i = from; i < toExclusive; i++) {
    const set = slots[i];
    if (!set) continue;
    for (const n of sortedNumsFromSet(set)) used.add(n);
  }
  return used;
};

export const unusedFromPool = (
  pool: readonly number[],
  used: ReadonlySet<number>,
): number[] => pool.filter((n) => !used.has(n));

/** 미사용이 부족하면 풀에서 번호를 채워 leftover 세트를 만들 수 있게 한다 */

export const expandLeftPool = (
  unused: readonly number[],
  pool: readonly number[],
  minSize = 6,
): number[] => {
  if (unused.length >= minSize) return [...unused];
  const have = new Set(unused);
  const extra = pool.filter((n) => !have.has(n));
  return [...unused, ...extra].slice(0, minSize);
};

export const leftoverPool = (
  slots: readonly (GeneratedSet | null)[],
  pool: readonly number[],
  from: number,
  to: number,
  minSize: number,
): number[] =>
  expandLeftPool(
    unusedFromPool(pool, numsUsedInSlots(slots, from, to)),
    pool,
    minSize,
  );
