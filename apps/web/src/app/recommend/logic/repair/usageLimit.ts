import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';

/** 번호가 20세트 전체 사용 한도 내인지 */

export const canUseNum = (
  n: number,
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): boolean => {
  if (!usage) return true;
  return (usage.get(n) ?? 0) < max;
};

export const filterUsageAvail = (
  nums: readonly number[],
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): number[] => {
  if (!usage) return [...nums];
  return nums.filter((n) => canUseNum(n, usage, max));
};

export const isSetWithinUsageLimit = (
  sorted: readonly number[],
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): boolean => {
  if (!usage) return true;
  return sorted.every((n) => canUseNum(n, usage, max));
};
