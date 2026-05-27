/** 번호대 라벨(1~45를 5개 번호 단위 9구간으로 분할) */
export const NUMBER_BAND_LABELS = [
  '1~5',
  '6~10',
  '11~15',
  '16~20',
  '21~25',
  '26~30',
  '31~35',
  '36~40',
  '41~45',
] as const;

export const BAND_COUNT = NUMBER_BAND_LABELS.length;
export const POSITION_COUNT = 6;
export const BAND_WIDTH = 5;
