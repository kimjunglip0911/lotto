import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';

/** 번호가 20세트 전체 사용 한도 내인지 */

export const canUseNum = (
  n: number,
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): boolean => {
  // 3회 한도 임시 비활성 — 재활성화 시 아래 주석을 되돌린다
  void n;
  void usage;
  void max;
  return true;
  // if (!usage) return true;
  // return (usage.get(n) ?? 0) < max;
};

export const filterUsageAvail = (
  nums: readonly number[],
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): number[] => {
  // 3회 한도 임시 비활성 — 재활성화 시 아래 주석을 되돌린다
  void usage;
  void max;
  return [...nums];
  // if (!usage) return [...nums];
  // return nums.filter((n) => canUseNum(n, usage, max));
};

export const isSetWithinUsageLimit = (
  sorted: readonly number[],
  usage: ReadonlyMap<number, number> | undefined,
  max: number = MAX_NUM_USAGE,
): boolean => {
  // 3회 한도 임시 비활성 — 재활성화 시 아래 주석을 되돌린다
  void sorted;
  void usage;
  void max;
  return true;
  // if (!usage) return true;
  // return sorted.every((n) => canUseNum(n, usage, max));
};
