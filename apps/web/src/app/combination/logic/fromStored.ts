import type { PositionBandDistributionRow } from '../types';
import type { ComboStoredPayload } from './storedRows';

const toRow = (raw: Record<string, unknown>): PositionBandDistributionRow => ({
  position: Number(raw.position),
  bandLabel: String(raw.band_label ?? raw.bandLabel),
  drawCount: Number(raw.draw_count ?? raw.drawCount),
  percentage: Number(raw.percentage),
});

/** DB 행 또는 API JSON을 화면·추천용 저장본으로 바꾼다. */
export const fromBandRows = (
  dbRows: readonly Record<string, unknown>[],
): ComboStoredPayload => {
  if (dbRows.length === 0) return { totalDraws: 0, rows: [] };
  const first = dbRows[0]!;
  const totalDraws = Number(first.total_draws ?? first.totalDraws ?? 0);
  return { totalDraws, rows: dbRows.map(toRow) };
};
