/** 당첨번호·저장 상태 타입 */

export type SaveStatus = 'idle' | 'success' | 'error';

export type InputNumber = number | '';

export interface WinningNumbersByDraw {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
}

export const isValidLottoNumber = (value: InputNumber): value is number =>
  typeof value === 'number' && value >= 1 && value <= 45;
