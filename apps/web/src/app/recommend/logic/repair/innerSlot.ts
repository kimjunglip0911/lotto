import { innerSlotKey as comboInnerSlotKey } from '@/app/recommend/logic/combo/bandSlot';

/** 구간×칸 Map 키 — 1단위 구간에서는 항상 "band:0" 형태 */

export const innerSlotKey = (n: number): string => comboInnerSlotKey(n);
