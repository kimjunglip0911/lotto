import type { PositionBandDistributionRow } from './distribution';

export type ComboWinKey = '1y' | '3y' | 'all';

/** 조합 분석 화면의 기간별 집계. windowSize가 null이면 전체. */
export type ComboWinView = {
  key: ComboWinKey;
  label: string;
  windowSize: number | null;
  totalDraws: number;
  rows: PositionBandDistributionRow[];
};
