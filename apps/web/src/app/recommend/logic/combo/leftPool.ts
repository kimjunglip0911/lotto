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
