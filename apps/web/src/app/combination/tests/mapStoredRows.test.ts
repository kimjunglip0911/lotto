import { describe, expect, it } from 'vitest';
import { fromBandRows } from '../logic/fromStored';

describe('fromBandRows mapping', () => {
  it('저장본 행을 position/bandLabel/drawCount/percentage로 매핑한다', () => {
    const payload = fromBandRows([
      {
        position: 1,
        band_label: '12',
        draw_count: 4,
        percentage: 2.5,
        total_draws: 160,
      },
    ]);
    expect(payload.totalDraws).toBe(160);
    expect(payload.rows).toEqual([
      { position: 1, bandLabel: '12', drawCount: 4, percentage: 2.5 },
    ]);
  });

  it('빈 배열이면 totalDraws 0과 빈 rows다', () => {
    expect(fromBandRows([])).toEqual({ totalDraws: 0, rows: [] });
  });
});
