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
