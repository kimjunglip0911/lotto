import { describe, expect, it } from 'vitest';
import { buildPoolByBand, sequentialPickByBands } from '@/app/recommend/logic/repair';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';

describe('sequentialPickByBands', () => {
  it('1구간부터 순차 선택하고 6개 중복 없이 고른다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 5, 10, 15, 20, 25];
    const usage = new Map<number, number>();
    for (const n of pool) usage.set(n, 0);

    const picked = sequentialPickByBands(poolByBand, bandTargets, LOTTO_SUM_MIN, LOTTO_SUM_MAX, {
      usage,
    });
    expect(picked).not.toBeNull();
    if (!picked) return;
    expect(new Set(picked).size).toBe(6);
  });

  it('자리 ladder로 1등 band 불가 시 다음 순위 band를 쓴다', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const poolByBand = buildPoolByBand(pool);
    const bandLadder = [
      [0, 5],
      [0, 5],
      [6, 7],
      [8, 9],
      [10, 11],
      [11, 10],
    ];
    const bandTargets = [0, 0, 6, 8, 10, 11];
    const usage = new Map<number, number>();
    for (const n of pool) usage.set(n, 0);

    const picked = sequentialPickByBands(
      poolByBand,
      bandTargets,
      LOTTO_SUM_MIN,
      LOTTO_SUM_MAX,
      { usage },
      bandLadder,
    );
    expect(picked).not.toBeNull();
    if (!picked) return;
    expect(picked).toContain(1);
    expect(picked).toContain(6);
    expect(new Set(picked).size).toBe(6);
  });

  it('1등 band 한도 소진 시 ladder 2등 band를 쓴다', () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const usage = new Map(pool.map((n) => [n, 0]));
    usage.set(1, 3);
    const ladder = Array.from({ length: 6 }, () => Array.from({ length: 45 }, (_, i) => i));

    const picked = sequentialPickByBands(
      poolByBand,
      [0, 1, 2, 3, 4, 5],
      LOTTO_SUM_MIN,
      LOTTO_SUM_MAX,
      { usage },
      ladder,
    );
    expect(picked).not.toBeNull();
    expect(picked).toContain(3);
  });

  it('고저 구간과 무관하게 선택한다', () => {
    const pool = Array.from({ length: 20 }, (_, i) => i + 1);
    const poolByBand = buildPoolByBand(pool);
    const bandTargets = [0, 1, 2, 3, 4, 5];
    const picked = sequentialPickByBands(poolByBand, bandTargets, 500, 600, {});
    expect(picked).not.toBeNull();
    expect(new Set(picked!).size).toBe(6);
  });
});
