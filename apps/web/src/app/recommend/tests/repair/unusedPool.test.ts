import { describe, expect, it } from 'vitest';
import { buildTailUnusedSet, buildUnusedPoolSet } from '@/app/recommend/logic/repair/unusedPool';
import { setKey } from '@/app/recommend/logic/combo/toSet';

describe('buildUnusedPoolSet', () => {
  it('한도 남은 번호로 고저 합·중복 없는 조합을 만든다', () => {
    const pool = Array.from({ length: 20 }, (_, i) => i + 1);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    usage.set(1, 3);
    usage.set(2, 3);
    const usedKeys = new Set<string>();

    const found = buildUnusedPoolSet(pool, 80, 120, usage, usedKeys);
    expect(found).not.toBeNull();
    expect(found!.every((n) => n !== 1 && n !== 2)).toBe(true);
    const sum = found!.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThanOrEqual(80);
    expect(sum).toBeLessThanOrEqual(120);
  });

  it('이미 만든 조합은 건너뛰고 다음 조합을 찾는다', () => {
    const pool = Array.from({ length: 15 }, (_, i) => i + 1);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const first = buildUnusedPoolSet(pool, 40, 60, usage, new Set());
    expect(first).not.toBeNull();
    const usedKeys = new Set([setKey(first!)]);
    const second = buildUnusedPoolSet(pool, 40, 60, usage, usedKeys);
    expect(second).not.toBeNull();
    expect(setKey(second!)).not.toBe(setKey(first!));
  });

  it('한도 남은 번호가 6개 미만이면 null', () => {
    const pool = Array.from({ length: 10 }, (_, i) => i + 1);
    const usage = new Map<number, number>(pool.map((n) => [n, 3]));
    usage.set(1, 0);
    usage.set(2, 1);
    const found = buildUnusedPoolSet(pool, 21, 300, usage, new Set());
    expect(found).toBeNull();
  });
});

describe('buildTailUnusedSet', () => {
  it('0회 사용 번호만으로 6개를 만든다', () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    for (let n = 1; n <= 30; n++) usage.set(n, 2);
    const found = buildTailUnusedSet(pool, usage, new Set());
    expect(found).not.toBeNull();
    expect(found!.every((n) => n >= 31)).toBe(true);
  });

  it('고저 구간과 무관하게 작은 번호 조합도 허용한다', () => {
    const pool = [1, 2, 3, 4, 5, 6, 40, 41, 42];
    const usage = new Map<number, number>(pool.map((n) => [n, 0]));
    const found = buildTailUnusedSet(pool, usage, new Set());
    expect(found).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
