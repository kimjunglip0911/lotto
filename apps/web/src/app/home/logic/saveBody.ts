/** 당첨번호 저장 API 요청 본문을 만든다 */

import type { InputNumber } from '../types/home';

export const buildSaveWinningBody = (
  selectedDraw: number,
  winningNumbers: InputNumber[],
  winningBonus: InputNumber,
) => ({
  draw_no: selectedDraw,
  num1: winningNumbers[0],
  num2: winningNumbers[1],
  num3: winningNumbers[2],
  num4: winningNumbers[3],
  num5: winningNumbers[4],
  num6: winningNumbers[5],
  bonus_num: winningBonus,
});
