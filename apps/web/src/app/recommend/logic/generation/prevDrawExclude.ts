import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';

/** 제외 번호를 뺀 추천 번호 풀 */

export const poolWithoutNums = (
  excluded: readonly number[],
  pool: readonly number[] = FULL_LOTTO_POOL,
): number[] => {
  if (excluded.length === 0) return [...pool];
  const ban = new Set(excluded);
  return pool.filter((n) => !ban.has(n));
};
