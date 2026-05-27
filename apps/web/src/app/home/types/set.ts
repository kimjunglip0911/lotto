/** 분석 세트·카드 ViewModel 타입 */

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

export interface LotterySetViewModel {
  id?: number;
  numbers: number[];
  method?: string;
  drawNo: number;
}

export interface LotteryCardProps {
  setIndex: number;
  drawNo: number;
  numbers: number[];
  method?: string;
}
