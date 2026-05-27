import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand';

/** 구간×칸 Map 키 */

const BAND_WIDTH = 5;

export const innerSlotKey = (n: number): string => {
  const b = numberToBandIndex(n);
  return `${b}:${n - (b * BAND_WIDTH + 1)}`;
};
