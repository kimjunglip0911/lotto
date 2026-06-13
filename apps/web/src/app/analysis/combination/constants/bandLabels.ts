/** 번호대 라벨(1~45를 번호 1개 단위 45구간으로 분할) */
export const NUMBER_BAND_LABELS = Array.from({ length: 45 }, (_, i) =>
  String(i + 1),
) as readonly string[];

export const BAND_COUNT = NUMBER_BAND_LABELS.length;
export const POSITION_COUNT = 6;
export const BAND_WIDTH = 1;
