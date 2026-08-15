import type { PositionBandDistributionRow } from '../types';

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
