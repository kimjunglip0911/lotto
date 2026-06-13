import { describe, expect, it } from 'vitest';
import { buildPoolByBand, sequentialPickByBands } from '@/app/recommend/logic/repair';

describe('sequentialPickByBands', () => {
  it('1구간부터 순차 선택하고 고저 합 구간을 만족한다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 5, 10, 15, 20, 25];
    const usage = new Map<number, number>();
    for (const n of pool) usage.set(n, 0);

    const picked = sequentialPickByBands(poolByBand, bandTargets, 50, 200, { usage });
    expect(picked).not.toBeNull();
    if (!picked) return;
    const sum = picked.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThanOrEqual(50);
    expect(sum).toBeLessThanOrEqual(200);
    expect(new Set(picked).size).toBe(6);
  });

  it('고저 구간 밖이면 null을 반환한다', () => {
    const pool = Array.from({ length: 20 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 1, 2, 3, 4, 5];
    const picked = sequentialPickByBands(poolByBand, bandTargets, 500, 600, {});
    expect(picked).toBeNull();
  });
});
