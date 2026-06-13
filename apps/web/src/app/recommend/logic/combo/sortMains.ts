import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';

/** 당첨 행의 본번호 6개를 오름차순으로 정렬한 복사본을 만든다 */

export const withSortedMains = (row: WinningNumberRow): WinningNumberRow => {
  const m = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6].sort((a, b) => a - b);
  return { ...row, num1: m[0]!, num2: m[1]!, num3: m[2]!, num4: m[3]!, num5: m[4]!, num6: m[5]! };
};
