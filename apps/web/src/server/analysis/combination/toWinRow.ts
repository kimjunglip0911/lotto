import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** DB 당첨 행을 집계 입력 타입으로 바꾼다. */
export const toWinRow = (raw: Record<string, unknown>): WinningNumberRow => ({
  draw_no: Number(raw.draw_no),
  num1: Number(raw.num1),
  num2: Number(raw.num2),
  num3: Number(raw.num3),
  num4: Number(raw.num4),
  num5: Number(raw.num5),
  num6: Number(raw.num6),
  bonus_num: Number(raw.bonus_num),
});
