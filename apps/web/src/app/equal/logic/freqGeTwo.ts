import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { countWithBonus } from './countWithBonus';

/** 창 안에서 보너스 포함 출현이 2회 이상인 번호(오름차순). */
export const freqGeTwo = (rows: readonly WinningNumberRow[]): number[] => {
  const counts = countWithBonus(rows);
  const out: number[] = [];
  counts.forEach((count, index) => {
    if (count >= 2) out.push(index + 1);
  });
  return out;
};
