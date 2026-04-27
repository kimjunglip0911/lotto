export type SaveStatus = 'idle' | 'success' | 'error';

export type InputNumber = number | '';

export interface LotterySetData {
  id?: number;
  draw_no?: number;
  method?: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
}

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

export interface LotterySetViewModel {
  id?: number;
  numbers: number[];
  method?: string;
  drawNo: number;
}
