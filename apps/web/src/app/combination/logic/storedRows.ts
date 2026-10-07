import type { PositionBandDistributionRow } from '../types';
import type { ComboWinView } from '../types/window';

export type ComboBandInsert = {
  position: number;
  bandLabel: string;
  drawCount: number;
  percentage: number;
  totalDraws: number;
};

export type ComboStoredPayload = {
  totalDraws: number;
  rows: PositionBandDistributionRow[];
};

/** 저장본(추천용 전체)과 화면용 기간 집계. */
export type ComboPagePayload = ComboStoredPayload & {
  windows: ComboWinView[];
};

/** 집계 결과를 저장 행으로 바꾼다. 이력이 없으면 빈 배열. */
export const toBandInserts = (
  totalDraws: number,
  rows: readonly PositionBandDistributionRow[],
): ComboBandInsert[] =>
  rows.map((row) => ({
    position: row.position,
    bandLabel: row.bandLabel,
    drawCount: row.drawCount,
    percentage: row.percentage,
    totalDraws,
  }));
