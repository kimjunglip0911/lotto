import { describe, expect, it } from 'vitest';
import { rankPositionBandRows } from '../logic/rankPositionBands';
import type { PositionBandDistributionRow } from '../types';

describe('rankPositionBandRows', () => {
  it('assigns rank 1 to highest percentage per position', () => {
    const rows: PositionBandDistributionRow[] = [
      { position: 1, bandLabel: '1', drawCount: 10, percentage: 50 },
      { position: 1, bandLabel: '2', drawCount: 5, percentage: 25 },
      { position: 1, bandLabel: '3', drawCount: 5, percentage: 25 },
    ];
    const ranked = rankPositionBandRows(rows);
    expect(ranked.find((r) => r.bandLabel === '1')?.rank).toBe(1);
    expect(ranked.find((r) => r.bandLabel === '2')?.rank).toBe(2);
  });

  it('breaks percentage ties by lower band number', () => {
    const rows: PositionBandDistributionRow[] = [
      { position: 2, bandLabel: '5', drawCount: 5, percentage: 30 },
      { position: 2, bandLabel: '3', drawCount: 5, percentage: 30 },
      { position: 2, bandLabel: '7', drawCount: 4, percentage: 20 },
    ];
    const ranked = rankPositionBandRows(rows);
    const pos2 = ranked.filter((r) => r.position === 2);
    expect(pos2[0]?.bandLabel).toBe('3');
    expect(pos2[0]?.rank).toBe(1);
    expect(pos2[1]?.bandLabel).toBe('5');
    expect(pos2[1]?.rank).toBe(2);
  });
});
