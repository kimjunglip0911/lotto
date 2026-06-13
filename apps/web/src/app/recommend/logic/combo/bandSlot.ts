import { BAND_WIDTH } from '@/app/combination/constants/bandLabels';
import { numberToBandIndex } from '@/app/combination/logic/numberToBand';

/** 번호가 속한 band 구간의 시작·내부 슬롯·고유 키를 계산한다 (1단위 구간에서는 innerSlot 항상 0) */

export const bandStartForIndex = (bandIndex: number): number => bandIndex * BAND_WIDTH + 1;

export const bandInnerSlot = (n: number): number => n - bandStartForIndex(numberToBandIndex(n));

export const innerSlotKey = (n: number): string => {
  const b = numberToBandIndex(n);
  return `${b}:${n - bandStartForIndex(b)}`;
};
