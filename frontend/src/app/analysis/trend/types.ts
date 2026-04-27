export type WinningNumberRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

export type TrendPhase = 'up_cont' | 'topping' | 'recovering' | 'down_cont';

export type NumberTrendResult = {
  number: number;
  emaFast: number;
  emaSlow: number;
  phase: TrendPhase;
};
