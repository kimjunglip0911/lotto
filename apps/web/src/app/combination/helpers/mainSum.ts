import type { WinningNumberRow } from '@/lib/accu-nums/types';

export function mainSum(row: WinningNumberRow): number {
  return row.num1 + row.num2 + row.num3 + row.num4 + row.num5 + row.num6;
}
