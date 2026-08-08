import { toMainNumbersOnly } from '@/lib/accu-nums/logic/numCounts';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** 한 회차에서 간격 집계에 쓸 번호(본번호 6 + 보너스, 중복 제거) */

export const numsForGapDraw = (row: WinningNumberRow): number[] =>
  [...new Set([...toMainNumbersOnly(row), row.bonus_num])].filter(
    (num) => num >= 1 && num <= 45,
  );
