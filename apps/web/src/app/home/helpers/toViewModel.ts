/** DB 세트 행을 카드 표시용 ViewModel로 변환 */

import type { LotterySetData, LotterySetViewModel } from '../types/home';

export const toViewModel = (
  sets: LotterySetData[],
  selectedDraw: number | null,
): LotterySetViewModel[] =>
  sets.map((set) => ({
    id: set.id,
    numbers: [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6],
    method: set.method,
    drawNo: set.draw_no ?? selectedDraw ?? 0,
  }));
