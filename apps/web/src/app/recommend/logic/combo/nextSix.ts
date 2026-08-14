import { setKey } from '@/app/recommend/logic/combo/toSet';

/** 막힌 조합을 건너뛰고 다음 6개 조합을 고른다 */

export const nextSixCombo = (
  nums: readonly number[],
  blocked: ReadonlySet<string>,
): number[] | null => {
  if (nums.length < 6) return null;
  const search = (from: number, acc: number[]): number[] | null => {
    if (acc.length === 6) {
      const key = setKey(acc);
      return blocked.has(key) ? null : [...acc];
    }
    for (let i = from; i < nums.length; i++) {
      acc.push(nums[i]!);
      const found = search(i + 1, acc);
      if (found) return found;
      acc.pop();
    }
    return null;
  };
  return search(0, []);
};
