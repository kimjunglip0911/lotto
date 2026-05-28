/** 당첨번호 저장 API 요청 본문을 만든다 */

import type { InputNumber, SaveWinBody } from '../types/home';

export const buildSaveWinningBody = (
  selectedDraw: number,
  winningNumbers: InputNumber[],
  winningBonus: InputNumber,
): SaveWinBody => ({
  draw_no: selectedDraw,
  num1: winningNumbers[0] as number,
  num2: winningNumbers[1] as number,
  num3: winningNumbers[2] as number,
  num4: winningNumbers[3] as number,
  num5: winningNumbers[4] as number,
  num6: winningNumbers[5] as number,
  bonus_num: winningBonus as number,
});
