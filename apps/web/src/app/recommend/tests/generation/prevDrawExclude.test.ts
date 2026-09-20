import { describe, expect, it } from 'vitest';
import { poolWithoutNums } from '@/app/recommend/logic/generation/prevDrawExclude';

describe('prevDrawExclude', () => {
  it('제외 번호를 풀에서 뺀다', () => {
    const pool = poolWithoutNums([1, 45, 20]);
    expect(pool).toHaveLength(42);
    expect(pool.includes(1)).toBe(false);
    expect(pool.includes(20)).toBe(false);
    expect(pool.includes(45)).toBe(false);
  });
});
