import { METHOD_JL } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { innerSlotKey } from '@/app/recommend/logic/combo/bandSlot';

/** 번호 배열을 GeneratedSet으로 변환 */

export const setKey = (nums: number[]): string =>
  [...nums].sort((a, b) => a - b).join(',');

export const toGeneratedSet = (nums: number[], strategy: string): GeneratedSet => {
  const s = [...nums].sort((a, b) => a - b);
  return {
    num1: s[0]!,
    num2: s[1]!,
    num3: s[2]!,
    num4: s[3]!,
    num5: s[4]!,
    num6: s[5]!,
    method: METHOD_JL,
    strategy,
  };
};

export const bumpUsage = (
  sorted: readonly number[],
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
): void => {
  for (const n of sorted) {
    usage.set(n, (usage.get(n) ?? 0) + 1);
    const key = innerSlotKey(n);
    innerSlotUsage.set(key, (innerSlotUsage.get(key) ?? 0) + 1);
  }
};

export const unbumpUsage = (
  sorted: readonly number[],
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
): void => {
  for (const n of sorted) {
    const next = (usage.get(n) ?? 0) - 1;
    usage.set(n, next > 0 ? next : 0);
    const key = innerSlotKey(n);
    const slotNext = (innerSlotUsage.get(key) ?? 0) - 1;
    innerSlotUsage.set(key, slotNext > 0 ? slotNext : 0);
  }
};

export const sortedNumsFromSet = (set: GeneratedSet): number[] =>
  [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6];

export const releaseGeneratedSet = (
  set: GeneratedSet,
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
): void => {
  const sorted = sortedNumsFromSet(set);
  usedKeys.delete(setKey(sorted));
  unbumpUsage(sorted, usage, innerSlotUsage);
};
