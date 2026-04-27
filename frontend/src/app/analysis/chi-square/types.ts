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

export type ChiSquareResult = {
  number: number;
  observed: number;
  expected: number;
  deviation: number;
  chiSquare: number;
  isLowFreq: boolean;
  isHighFreq: boolean;
};
