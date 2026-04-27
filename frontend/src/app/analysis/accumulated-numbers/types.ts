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

export type WindowConfig = {
  key: string;
  title: string;
  windowSize: number;
  noDataMessage: string;
};

export type WindowChartData = {
  key: string;
  title: string;
  counts: number[];
  analyzedDrawCount: number;
  noDataMessage: string;
};
