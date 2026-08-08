import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** 테스트용 당첨 행(주6+보너스). */
export const draw = (
  draw_no: number,
  nums: [number, number, number, number, number, number],
  bonus_num: number,
): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num,
});
